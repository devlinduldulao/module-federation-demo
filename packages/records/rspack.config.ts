// ============================================================================
// RECORDS — a REMOTE (port 3001), the shell's "/records" route
// ----------------------------------------------------------------------------
// The EAGER module: the shell prefetches this remote on mount, so its chunk is
// already cached by the time the user clicks. That is why the shell imports the
// plain "./MedicalRecords" rather than the streaming wrapper.
//
// Runs standalone on http://localhost:3001 and as a module inside the shell.
// ============================================================================

import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@rspack/cli";
import * as rspack from "@rspack/core";
import { ReactRefreshRspackPlugin } from "@rspack/plugin-react-refresh";

// ESM package ("type": "module"), so CommonJS __filename/__dirname are absent.
// Rebuild them from import.meta.url — Rspack config paths must be absolute.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The function form of defineConfig receives the CLI env and argv, giving access
// to the `--mode` flag passed by the dev/build scripts.
export default defineConfig((_env, argv = {}) => {
  // CLI flag → NODE_ENV → development.
  const mode = argv.mode || process.env.NODE_ENV || "development";
  const isDev = mode === "development";

  return {
    // Base directory for resolving entries and loaders, pinned so the build does
    // not depend on the caller's working directory.
    context: __dirname,

    // STANDALONE entry point. Ignored when the shell consumes this remote — the
    // host loads remoteEntry.js instead.
    // src/index.tsx is only `import("./bootstrap")`: the async boundary that
    // shared React with `eager: false` requires.
    entry: {
      main: "./src/index.tsx",
    },

    // Selects Rspack's default optimization set: readable dev output, or
    // minified and tree-shaken production output.
    mode,

    // "web" → browser-targeted runtime code. "es2020" → the syntax level Rspack
    // may leave intact, so modern syntax is not needlessly down-levelled.
    target: ["web", "es2020"],

    output: {
      // Build destination. The deploy workflow copies this to /remotes/records/.
      path: path.resolve(__dirname, "dist"),

      // Namespaces this bundle's runtime globals. Five bundles run in one browser
      // page; identical names would collide. Must equal the federation `name`
      // below and the key the shell uses in its `remotes` map.
      uniqueName: "records",

      // "auto" = derive the asset base URL from the currently executing script.
      // One build therefore works on localhost:3001 and under /remotes/records/
      // on GitHub Pages. Never hardcode publicPath in a remote.
      publicPath: "auto",

      // Clear dist/ before each build so stale hashed assets do not pile up.
      clean: true,
    },

    resolve: {
      // Extensions tried for extensionless imports, in order.
      extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],

      // Import shortcuts, mirrored in tsconfig.json `paths`. If the two drift,
      // the build succeeds and `pnpm typecheck` fails.
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@components": path.resolve(__dirname, "src/components"),
        "@lib": path.resolve(__dirname, "src/lib"),
      },
    },

    module: {
      rules: [
        {
          // ---- TypeScript + JSX ------------------------------------------------
          test: /\.(?:js|mjs|jsx|ts|tsx)$/,

          // Dependencies ship pre-compiled — re-transpiling them would dominate
          // the build time for no benefit.
          exclude: /node_modules/,

          use: {
            // "builtin:" means Rust, inside Rspack. Replaces both babel-loader and
            // ts-loader with no Node.js process in the loop.
            loader: "builtin:swc-loader",
            options: {
              // Detect TS vs JSX per file instead of forcing a single parser.
              detectSyntax: "auto",
              jsc: {
                transform: {
                  react: {
                    // Modern JSX transform — components need no `import React`.
                    runtime: "automatic",

                    // Development-only helpers (component names, source locations
                    // in errors), stripped from production builds.
                    development: isDev,

                    // Emit Fast Refresh hooks. Requires ReactRefreshRspackPlugin
                    // below to be present too — one without the other is a no-op.
                    refresh: isDev,
                  },
                  // Rspack 2.1: Rust port of React Compiler — auto-memoization
                  // at build time, 7-13x faster than the Babel plugin.
                  // Note MedicalRecords.tsx still contains useMemo/useCallback:
                  // those are for referential stability, not performance. The
                  // compiler handles the performance side automatically.
                  reactCompiler: true,
                },
              },
            },
          },
        },
        {
          // ---- CSS -------------------------------------------------------------
          test: /\.css$/,

          // Rspack's native CSS pipeline (Rust), replacing style-loader + css-loader.
          // Federation-relevant: MedicalRecords.tsx imports "./index.css" itself,
          // because the host never runs this package's bootstrap.tsx. Every exposed
          // module is an entrypoint and carries its own styles.
          type: "css",

          // Runs first — Tailwind CSS v4 is a PostCSS plugin. Loaders apply
          // right-to-left: postcss-loader, then Rspack's CSS handling.
          use: ["postcss-loader"],
        },
        // No image or font rules: this module imports neither. Add a rule when a
        // new file type actually appears in src/.
      ],
    },

    plugins: [
      // ======================================================================
      // THE PLUGIN THAT MAKES THIS A REMOTE
      // ======================================================================
      new rspack.container.ModuleFederationPlugin({
        // Container identity. The same string appears in three places:
        // here, `output.uniqueName` above, and the shell's `remotes` key.
        name: "records",

        // The manifest the host fetches first. It lists what this remote exposes
        // and which shared modules it can provide — the start of the handshake.
        filename: "remoteEntry.js",

        // ---- exposes: THIS MODULE'S PUBLIC API -------------------------------
        // The contract with the host team. "./MedicalRecords" becomes the
        // specifier `records/MedicalRecords` on the shell side.
        //
        // Both files are REAL RUNTIME ENTRYPOINTS: they must import their own CSS
        // and work with no host present, because bootstrap.tsx does not run for them.
        //
        // Renaming a key breaks the host at RUNTIME, not at build time — the shell
        // compiles cleanly and renders a "Module Unavailable" fallback instead.
        exposes: {
          // The plain component. The shell imports THIS one, because records is
          // the "eager" module — prefetched, so it must not suspend.
          "./MedicalRecords": "./src/MedicalRecords.tsx",

          // The suspending wrapper: a cached Resource that throws a promise for
          // 2500 ms so a Suspense fallback can render. The reference implementation
          // of the pattern used across this repo.
          "./StreamingMedicalRecords": "./src/StreamingMedicalRecords.tsx",
        },

        // ---- shared: DEDUPLICATION -------------------------------------------
        // Declared identically in all five packages. Both sides must agree for a
        // module to be deduplicated at runtime.
        shared: {
          react: {
            // Exactly ONE React instance across the whole page. Without it, this
            // remote loads its own React, hooks resolve against a different
            // dispatcher than the one that rendered, and the app throws
            // "Invalid hook call". The most important line in this file.
            singleton: true,

            // Warn rather than throw on a version mismatch — remotes here deploy
            // independently, so exact lockstep is unrealistic.
            strictVersion: false,

            // The range used to negotiate which offered copy wins.
            requiredVersion: "^19.2.7",

            // Resolve React asynchronously rather than at startup. Precisely why
            // src/index.tsx must be `import("./bootstrap")`.
            eager: false,
          },
          "react-dom": {
            singleton: true,
            strictVersion: false,
            requiredVersion: "^19.2.7",
            eager: false,
          },
          // React 18+ made the client renderer a separate specifier. It must be
          // shared explicitly; sharing "react-dom" does not include it.
          "react-dom/client": {
            singleton: true,
            strictVersion: false,
            requiredVersion: "^19.2.7",
            eager: false,
          },
        },
      }),

      // Builds dist/index.html for STANDALONE mode only. Inside the shell this
      // output is never used — the host's HTML is already rendered.
      new rspack.HtmlRspackPlugin({
        template: "./public/index.html",
        minify: !isDev,
        // Auto-inject script tags; content hashes make hand-written tags impossible.
        inject: true,
      }),

      // Compile-time constant substitution, which lets the minifier delete
      // unreachable branches.
      new rspack.DefinePlugin({
        // JSON.stringify is required — the substituted value must be a QUOTED
        // string, or it lands as a bare identifier and throws at runtime.
        "process.env.NODE_ENV": JSON.stringify(mode),
      }),

      // Fast Refresh runtime, development only. Pairs with `refresh: isDev` above.
      isDev && new ReactRefreshRspackPlugin(),

      // Removes the `false` that the line above leaves in production builds.
    ].filter(Boolean),

    optimization: {
      // Minify in production only — it is the slowest step and it ruins stack traces.
      minimize: !isDev,

      // Deliberately no `splitChunks`. Only the shell splits chunks, because the
      // host is the shared layer that already provides React to every remote.
    },

    devServer: {
      // Records' port. Part of the federation contract: it also appears in the
      // shell's `remoteUrl("records", 3001)` call and in the shell's MODULES array.
      port: 3001,

      // Hot Module Replacement — apply edits without a reload.
      hot: true,

      // Serve index.html for unmatched paths so standalone deep links work.
      historyApiFallback: true,

      // gzip dev server responses.
      compress: true,

      headers: {
        // MANDATORY for federation. The shell on :3000 fetches remoteEntry.js from
        // :3001 — a different port is a different ORIGIN. Without CORS headers the
        // browser blocks it and the module renders as unavailable.
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers":
          "X-Requested-With, content-type, Authorization",
      },

      client: {
        overlay: {
          // Show compile errors in the browser.
          errors: true,
          // Hide warnings, which would otherwise cover the app.
          warnings: false,
        },
      },

      static: {
        // Serve unprocessed files straight from public/.
        directory: path.join(__dirname, "public"),
      },
    },

    // "cheap-module-source-map" maps to original lines but not columns — quicker
    // to generate, accurate enough for debugging React components.
    // Keep source maps useful locally without publishing source to GitHub Pages.
    devtool: isDev ? "cheap-module-source-map" : false,

    // Rspack 2.1: persistent cache with automatic cleanup
    // (maxAge defaults to 7 days, maxVersions defaults to 3).
    // Caches compilation results on disk so cold starts reuse prior work.
    cache: { type: "persistent" },

    // Rspack 2.1 CLI defaults lazyCompilation.imports to true for browser targets.
    // That proxies import("./bootstrap"), which races Module Federation shared React
    // (eager: false) and leaves standalone remotes on a white screen.
    // DO NOT REMOVE — this is what keeps :3001 from rendering blank.
    lazyCompilation: false,

    // Minimal terminal output; five dev servers share one console.
    stats: "errors-only",

    performance: {
      // Budget warnings in production builds only.
      hints: isDev ? false : "warning",

      // 256 KB, half the shell's budget. Extra relevant here: this module is
      // PREFETCHED on shell mount, so its weight is paid by every user on every
      // visit, whether or not they ever open Records.
      maxAssetSize: 256000,
      maxEntrypointSize: 256000,
    },
  };
});
