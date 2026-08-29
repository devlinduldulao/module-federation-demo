// ============================================================================
// HOME — a REMOTE (port 3004), the shell's landing route "/"
// ----------------------------------------------------------------------------
// Compare this file to packages/shell/rspack.config.ts. They are nearly identical,
// and that is the point: a remote is just an app. The only structural differences
// are that this one declares `exposes` instead of `remotes`, and that it does not
// configure code splitting (the host owns that).
//
// This app runs standalone on http://localhost:3004 AND as a module inside the
// shell on http://localhost:3000. Both paths must keep working.
// ============================================================================

import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@rspack/cli";
import * as rspack from "@rspack/core";
import { ReactRefreshRspackPlugin } from "@rspack/plugin-react-refresh";

// This package is ESM ("type": "module"), so Node's CommonJS __filename/__dirname
// do not exist. Rebuild them from import.meta.url — Rspack needs absolute paths.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Note what is absent compared to the shell: no REMOTE_BASE_URL, no BASE_PATH.
// A remote never needs to know where it is deployed, because `publicPath: "auto"`
// below lets it discover that at runtime.

// The function form of defineConfig receives the CLI env and argv, which is how
// `--mode` reaches the config.
export default defineConfig((_env, argv = {}) => {
  // CLI flag → NODE_ENV → development.
  const mode = argv.mode || process.env.NODE_ENV || "development";
  const isDev = mode === "development";

  return {
    // Base directory for resolving entries and loaders. Set explicitly so the
    // build is identical whether run from here or from the repo root.
    context: __dirname,

    // Entry point for STANDALONE mode only. When the shell consumes this app it
    // ignores this entirely and loads remoteEntry.js instead.
    // src/index.tsx contains only `import("./bootstrap")` — the async boundary
    // required because shared React is `eager: false` below.
    entry: {
      main: "./src/index.tsx",
    },

    // Drives Rspack's default optimizations: readable output vs minified + tree-shaken.
    mode,

    // "web" → browser runtime. "es2020" → the syntax floor Rspack may leave in the
    // output, so optional chaining and dynamic import survive untranspiled.
    target: ["web", "es2020"],

    output: {
      // Where the build lands. The deploy workflow copies this to /remotes/home/.
      path: path.resolve(__dirname, "dist"),

      // Namespaces this bundle's internal runtime globals. In a federated page all
      // five bundles execute in ONE browser context — without unique names their
      // chunk-loading globals overwrite each other. MUST match the federation
      // `name` below and the key the shell uses in its `remotes` map.
      uniqueName: "home",

      // "auto" means: work out the base URL from the script that is currently
      // executing. This is what lets one build of this remote run on localhost:3004
      // AND under /remotes/home/ on GitHub Pages with no rebuild. Never hardcode
      // a publicPath in a remote.
      publicPath: "auto",

      // Wipe dist/ before each build so stale hashed assets do not accumulate.
      clean: true,
    },

    resolve: {
      // Extensions tried for extensionless imports, in order.
      extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],

      // Import shortcuts. Must be mirrored in tsconfig.json `paths` or the build
      // passes while `pnpm typecheck` fails.
      // (Present in home, records, and shell. The prescriptions and analytics
      // packages have no aliases and use relative imports.)
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

          // Never re-transpile dependencies — they ship compiled, and this exclusion
          // is the single largest saving in the build.
          exclude: /node_modules/,

          use: {
            // "builtin:" = implemented in Rust inside Rspack. No Node process, no
            // babel-loader, no ts-loader. This is where the speed comes from.
            loader: "builtin:swc-loader",
            options: {
              // Infer TS vs JSX per file rather than forcing one parser.
              detectSyntax: "auto",
              jsc: {
                transform: {
                  react: {
                    // Modern JSX transform — no `import React` needed in components.
                    runtime: "automatic",

                    // Development-only helpers: component names and source locations
                    // in error messages. Stripped in production.
                    development: isDev,

                    // Emit React Fast Refresh hooks. Requires ReactRefreshRspackPlugin
                    // below as well — one without the other does nothing.
                    refresh: isDev,
                  },
                  // Rspack 2.1: Rust port of React Compiler — auto-memoization
                  // at build time, 7-13x faster than the Babel plugin.
                  // So do NOT hand-write useMemo/useCallback/React.memo for
                  // performance in this package; the compiler already handles it.
                  reactCompiler: true,
                },
              },
            },
          },
        },
        {
          // ---- CSS -------------------------------------------------------------
          test: /\.css$/,

          // Rspack's NATIVE CSS pipeline, replacing style-loader + css-loader.
          // Relevant to federation: Home.tsx imports "./index.css" ITSELF, because
          // the host never executes this package's bootstrap.tsx. Anything listed
          // in `exposes` is a real entrypoint and must carry its own styles.
          type: "css",

          // Runs before Rspack's CSS handling. Present because Tailwind CSS v4 is a
          // PostCSS plugin (see postcss.config.cjs). Loaders apply right-to-left.
          use: ["postcss-loader"],
        },
        // Note: no image or font rules here. The shell owns those assets and this
        // module does not import any. Add a rule only when a file type appears.
      ],
    },

    plugins: [
      // ======================================================================
      // THE PLUGIN THAT MAKES THIS A REMOTE
      // ======================================================================
      new rspack.container.ModuleFederationPlugin({
        // This container's identity. Must equal `output.uniqueName` above and the
        // key the shell uses in its `remotes` map. Three places, one string.
        name: "home",

        // The manifest the host downloads. It is a tiny file listing what this
        // remote exposes and which shared modules it offers — the entry point of
        // the entire runtime handshake.
        filename: "remoteEntry.js",

        // ---- exposes: THIS MODULE'S PUBLIC API -------------------------------
        // The contract with the host team. Keys become import specifiers:
        // "./Home" → the shell writes `import("home/Home")`.
        //
        // These are REAL RUNTIME ENTRYPOINTS. Each file must import its own CSS
        // and stand up with no host present — bootstrap.tsx does not run for them.
        //
        // Renaming or removing a key is a BREAKING CHANGE that fails at runtime,
        // not at build time: the shell compiles fine and shows a fallback card.
        exposes: {
          // The plain component. The shell imports THIS one, because home is the
          // "instant" module — it must render the moment its chunk arrives.
          "./Home": "./src/Home.tsx",

          // The Suspense-suspending variant, kept for parity with the other remotes.
          "./StreamingHome": "./src/StreamingHome.tsx",
        },

        // ---- shared: DEDUPLICATION -------------------------------------------
        // Identical in all five packages. Both sides of a federation must declare
        // a module as shared for it to be deduplicated.
        shared: {
          react: {
            // Exactly ONE React instance in the page. The host and all four remotes
            // negotiate at runtime and pick a single copy. Without this, this remote
            // brings its own React, its hooks resolve against a different dispatcher,
            // and the page dies with "Invalid hook call".
            singleton: true,

            // Warn instead of throwing on a version mismatch. Remotes deploy
            // independently, so exact version lockstep is not realistic.
            strictVersion: false,

            // The range used to negotiate which copy wins.
            requiredVersion: "^19.2.7",

            // Load React asynchronously, not at startup. This is exactly why
            // src/index.tsx must be `import("./bootstrap")`.
            eager: false,
          },
          "react-dom": {
            singleton: true,
            strictVersion: false,
            requiredVersion: "^19.2.7",
            eager: false,
          },
          // React 18+ split the client renderer into its own specifier. Sharing
          // "react-dom" does NOT cover it — it must be listed separately or you get
          // a second copy of the renderer.
          "react-dom/client": {
            singleton: true,
            strictVersion: false,
            requiredVersion: "^19.2.7",
            eager: false,
          },
        },
      }),

      // Generates dist/index.html for STANDALONE mode. The host never uses it —
      // when the shell loads this remote, the shell's own HTML is already on screen.
      new rspack.HtmlRspackPlugin({
        template: "./public/index.html",
        minify: !isDev,
        // Inject <script> tags automatically — required, since content hashes make
        // hand-written tags impossible.
        inject: true,
      }),

      // Compile-time string substitution, enabling dead-code elimination.
      new rspack.DefinePlugin({
        // JSON.stringify is mandatory: the replacement must be a QUOTED string in
        // the output, or it becomes a bare identifier and throws at runtime.
        // No BASE_PATH here — a remote does not need to know its deploy path.
        "process.env.NODE_ENV": JSON.stringify(mode),
      }),

      // Fast Refresh runtime. Development only. Pairs with `refresh: isDev` above.
      isDev && new ReactRefreshRspackPlugin(),

      // Strips the `false` left behind in production — Rspack rejects falsy plugins.
    ].filter(Boolean),

    optimization: {
      // Minify in production only. Disabled in dev: it is the slowest step and it
      // destroys stack traces.
      minimize: !isDev,

      // NOTE what is missing: no `splitChunks`. Only the shell configures code
      // splitting, because the host already carries shared React for everyone.
      // A remote that split its own vendor chunk would mostly be re-splitting
      // modules the host has already provided.
    },

    devServer: {
      // Home's port. Part of the federation contract — it also appears in the
      // shell's `remoteUrl("home", 3004)` call and in the shell's MODULES registry.
      // Changing it here means changing it in all three places.
      port: 3004,

      // Hot Module Replacement — apply edits without a full reload.
      hot: true,

      // Serve index.html for unmatched paths, so standalone deep links work.
      historyApiFallback: true,

      // gzip dev server responses.
      compress: true,

      headers: {
        // MANDATORY for federation. The shell on :3000 fetches this remote's
        // remoteEntry.js from :3004. A different port is a different ORIGIN, so
        // without these headers the browser blocks the request and the module
        // falls back to "Module Unavailable".
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers":
          "X-Requested-With, content-type, Authorization",
      },

      client: {
        overlay: {
          // Surface compile errors in the browser.
          errors: true,
          // Suppress warnings — otherwise the overlay hides the app.
          warnings: false,
        },
        // No `progress: true` here. The shell enables it; with five dev servers
        // running, one progress indicator is informative and five are noise.
      },

      static: {
        // Serve unprocessed files from public/.
        directory: path.join(__dirname, "public"),
      },
    },

    // "cheap-module-source-map" maps to original lines but not columns — faster to
    // build and accurate enough for React work.
    // Keep source maps useful locally without publishing source to GitHub Pages.
    devtool: isDev ? "cheap-module-source-map" : false,

    // Rspack 2.1: persistent cache with automatic cleanup
    // (maxAge defaults to 7 days, maxVersions defaults to 3).
    // Disk-caches compilation results so a cold start reuses the previous build.
    cache: { type: "persistent" },

    // Rspack 2.1 CLI defaults lazyCompilation.imports to true for browser targets.
    // That proxies import("./bootstrap"), which races Module Federation shared React
    // (eager: false) and leaves standalone remotes on a white screen.
    // DO NOT REMOVE. This line is the difference between a working remote and a
    // blank page on :3004.
    lazyCompilation: false,

    // Keep terminal output minimal — five dev servers share one console.
    stats: "errors-only",

    performance: {
      // Budget warnings, production only.
      hints: isDev ? false : "warning",

      // 256 KB — half the shell's budget. A remote pays for its own weight at
      // runtime, downloaded when the user first reaches this module. Home is the
      // lightest module in the federation and should stay that way.
      maxAssetSize: 256000,
      maxEntrypointSize: 256000,
    },
  };
});
