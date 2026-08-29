// ============================================================================
// PRESCRIPTIONS — a REMOTE (port 3002), the shell's "/prescriptions" route
// ----------------------------------------------------------------------------
// A STREAMED module: nothing is prefetched. The shell imports the suspending
// wrapper "./StreamingPrescriptionOrders" and renders a skeleton until it
// resolves. Download size here is directly visible to the user as latency.
//
// This is also the only module that LISTENS for cross-module events — Records
// dispatches `addPrescription` on window and this module receives it. Note that
// nothing in this config expresses that: the event bus is a runtime convention
// on `window`, deliberately not a build-time dependency.
// ============================================================================

import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@rspack/cli";
import * as rspack from "@rspack/core";
import { ReactRefreshRspackPlugin } from "@rspack/plugin-react-refresh";

// ESM package ("type": "module"), so CommonJS __filename/__dirname do not exist.
// Rebuild them from import.meta.url — Rspack needs absolute paths.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The function form of defineConfig receives the CLI env and argv, which is how
// the `--mode` flag from the dev/build scripts reaches this config.
export default defineConfig((_env, argv = {}) => {
  // CLI flag → NODE_ENV → development.
  const mode = argv.mode || process.env.NODE_ENV || "development";
  const isDev = mode === "development";

  return {
    // Base directory for resolving entries and loaders, independent of the
    // caller's working directory.
    context: __dirname,

    // STANDALONE entry point, ignored when the shell consumes this remote.
    // src/index.tsx contains only `import("./bootstrap")` — the async boundary
    // that shared React with `eager: false` requires.
    entry: {
      main: "./src/index.tsx",
    },

    // Chooses Rspack's default optimization set for dev vs production.
    mode,

    // "web" → browser runtime code. "es2020" → the syntax floor Rspack may keep,
    // avoiding pointless down-levelling of modern syntax.
    target: ["web", "es2020"],

    output: {
      // Build destination. The deploy workflow copies this to /remotes/prescriptions/.
      path: path.resolve(__dirname, "dist"),

      // Namespaces this bundle's runtime globals so the five bundles sharing one
      // browser page do not overwrite each other's chunk loaders. Must match the
      // federation `name` below and the shell's `remotes` key.
      uniqueName: "prescriptions",

      // "auto" = derive the asset base URL from the executing script at runtime.
      // The same build therefore serves localhost:3002 and /remotes/prescriptions/
      // on GitHub Pages. Never hardcode publicPath in a remote.
      publicPath: "auto",

      // Empty dist/ before each build so stale hashed assets do not accumulate.
      clean: true,
    },

    resolve: {
      // Extensions tried for extensionless imports, in order.
      // NOTE: no `alias` block in this package. There is no "@", "@components", or
      // "@lib" here — imports are relative ("./lib/utils", "./types"). Adding an
      // alias would also require a matching tsconfig.json `paths` entry, or the
      // build would pass while `pnpm typecheck` fails.
      extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
    },

    module: {
      rules: [
        {
          // ---- TypeScript + JSX ------------------------------------------------
          test: /\.(?:js|mjs|jsx|ts|tsx)$/,

          // Dependencies ship compiled; re-transpiling them would dominate build time.
          exclude: /node_modules/,

          use: {
            // "builtin:" = Rust, inside Rspack. No Node process, and it replaces
            // babel-loader and ts-loader together.
            loader: "builtin:swc-loader",
            options: {
              // Infer TS vs JSX per file rather than forcing one parser.
              detectSyntax: "auto",
              jsc: {
                transform: {
                  react: {
                    // Modern JSX transform — no `import React` needed.
                    runtime: "automatic",

                    // Development-only helpers (component names, source locations
                    // in errors), removed from production builds.
                    development: isDev,

                    // Emit Fast Refresh hooks. Needs ReactRefreshRspackPlugin below
                    // as well — either alone does nothing.
                    refresh: isDev,
                  },
                  // Rspack 2.1: Rust port of React Compiler — auto-memoization
                  // at build time, 7-13x faster than the Babel plugin.
                  // So do not add useMemo/useCallback/React.memo for performance;
                  // the compiler already does that transformation.
                  reactCompiler: true,
                },
              },
            },
          },
        },
        {
          // ---- CSS -------------------------------------------------------------
          test: /\.css$/,

          // Rspack's native Rust CSS pipeline, replacing style-loader + css-loader.
          // Federation-relevant: PrescriptionOrders.tsx imports "./index.css"
          // itself. The host never executes this package's bootstrap.tsx, so an
          // exposed module must carry its own styles or it renders unstyled
          // inside the shell while looking fine standalone.
          type: "css",

          // Runs first, because Tailwind CSS v4 is a PostCSS plugin. Loaders apply
          // right-to-left: postcss-loader → Rspack's CSS handling.
          use: ["postcss-loader"],
        },
      ],
    },

    plugins: [
      // ======================================================================
      // THE PLUGIN THAT MAKES THIS A REMOTE
      // ======================================================================
      new rspack.container.ModuleFederationPlugin({
        // Container identity. The same string must appear in three places: here,
        // `output.uniqueName` above, and the shell's `remotes` key.
        name: "prescriptions",

        // The manifest the host downloads first, listing what this remote exposes
        // and which shared modules it offers.
        filename: "remoteEntry.js",

        // ---- exposes: THIS MODULE'S PUBLIC API -------------------------------
        // The contract with the host team. "./PrescriptionOrders" becomes the
        // specifier `prescriptions/PrescriptionOrders` on the shell side.
        //
        // Both are REAL RUNTIME ENTRYPOINTS: each imports its own CSS and works
        // with no host present, because bootstrap.tsx never runs for them.
        //
        // Renaming a key breaks the host at RUNTIME, not build time — the shell
        // still compiles and simply renders a "Module Unavailable" card.
        exposes: {
          // The plain component — used standalone and available to any future host.
          "./PrescriptionOrders": "./src/PrescriptionOrders.tsx",

          // The suspending wrapper. THIS is what the shell imports, because
          // prescriptions is a "streamed" module: skeleton first, content second.
          "./StreamingPrescriptionOrders": "./src/StreamingPrescriptionOrders.tsx",
        },

        // ---- shared: DEDUPLICATION -------------------------------------------
        // Identical across all five packages. Both sides must declare a module as
        // shared for it to be deduplicated at runtime.
        shared: {
          react: {
            // Exactly ONE React instance in the page. Without it this remote loads
            // its own React, its hooks resolve against a different dispatcher than
            // the renderer, and the page dies with "Invalid hook call".
            singleton: true,

            // Warn instead of throwing on a version mismatch, since remotes here
            // are deployed independently.
            strictVersion: false,

            // The range used to negotiate which offered copy of React wins.
            requiredVersion: "^19.2.7",

            // Resolve React asynchronously, not at startup — the reason
            // src/index.tsx must be `import("./bootstrap")`.
            eager: false,
          },
          "react-dom": {
            singleton: true,
            strictVersion: false,
            requiredVersion: "^19.2.7",
            eager: false,
          },
          // React 18+ split the client renderer into its own specifier; sharing
          // "react-dom" does not cover it, so it is listed explicitly.
          "react-dom/client": {
            singleton: true,
            strictVersion: false,
            requiredVersion: "^19.2.7",
            eager: false,
          },
        },
      }),

      // Generates dist/index.html for STANDALONE mode. Unused inside the shell,
      // where the host's HTML is already on screen.
      new rspack.HtmlRspackPlugin({
        template: "./public/index.html",
        minify: !isDev,
        // Auto-inject script tags — content hashes rule out hand-written ones.
        inject: true,
      }),

      // Compile-time constant substitution, enabling dead-branch elimination.
      new rspack.DefinePlugin({
        // JSON.stringify is required: the replacement must be a QUOTED string in
        // the output, or it becomes a bare identifier and throws at runtime.
        "process.env.NODE_ENV": JSON.stringify(mode),
      }),

      // Fast Refresh runtime, development only. Pairs with `refresh: isDev` above.
      isDev && new ReactRefreshRspackPlugin(),

      // Drops the `false` this leaves behind in production builds.
    ].filter(Boolean),

    optimization: {
      // Minify in production only — slowest step, and it destroys stack traces.
      minimize: !isDev,

      // No `splitChunks` here by design. Only the shell configures code splitting,
      // since the host is the shared layer that already supplies React.
    },

    devServer: {
      // Prescriptions' port. Part of the federation contract: it also appears in
      // the shell's `remoteUrl("prescriptions", 3002)` call and in MODULES.
      port: 3002,

      // Hot Module Replacement — apply edits without a full reload.
      hot: true,

      // Serve index.html for unmatched paths, so standalone deep links work.
      historyApiFallback: true,

      // gzip dev server responses.
      compress: true,

      headers: {
        // MANDATORY for federation. The shell on :3000 fetches this remote's
        // remoteEntry.js from :3002; a different port is a different ORIGIN, so
        // without CORS the browser blocks it and the module shows as unavailable.
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers":
          "X-Requested-With, content-type, Authorization",
      },

      client: {
        overlay: {
          // Surface compile errors in the browser.
          errors: true,
          // Suppress warnings, which would otherwise obscure the app.
          warnings: false,
        },
      },

      static: {
        // Serve unprocessed files from public/.
        directory: path.join(__dirname, "public"),
      },
    },

    // "cheap-module-source-map" maps to original lines but not columns — faster to
    // build, accurate enough for component debugging.
    // Keep source maps useful locally without publishing source to GitHub Pages.
    devtool: isDev ? "cheap-module-source-map" : false,

    // Rspack 2.1: persistent cache with automatic cleanup
    // (maxAge defaults to 7 days, maxVersions defaults to 3).
    // Disk-caches compilation results so cold starts reuse the previous build.
    cache: { type: "persistent" },

    // Rspack 2.1 CLI defaults lazyCompilation.imports to true for browser targets.
    // That proxies import("./bootstrap"), which races Module Federation shared React
    // (eager: false) and leaves standalone remotes on a white screen.
    // DO NOT REMOVE — without it, :3002 renders blank.
    lazyCompilation: false,

    // Keep the terminal readable; five dev servers share one console.
    stats: "errors-only",

    performance: {
      // Budget warnings, production builds only.
      hints: isDev ? false : "warning",

      // 256 KB, half the shell's budget. This module is loaded ON DEMAND with no
      // prefetch, so every byte here is time the user spends watching a skeleton.
      maxAssetSize: 256000,
      maxEntrypointSize: 256000,
    },
  };
});
