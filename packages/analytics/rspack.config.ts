// ============================================================================
// ANALYTICS — a REMOTE (port 3003), the shell's "/analytics" route
// ----------------------------------------------------------------------------
// A STREAMED module, like prescriptions: nothing is prefetched, so the shell
// imports the suspending wrapper "./StreamingClinicalAnalytics" and shows a
// skeleton until it resolves.
//
// This is the read-only module — it neither dispatches nor listens for
// cross-module events. It reads the theme the host broadcasts and renders. That
// makes it the easiest module in the federation to deploy independently: it has
// no contract to break beyond `exposes`.
// ============================================================================

import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@rspack/cli";
import * as rspack from "@rspack/core";
import { ReactRefreshRspackPlugin } from "@rspack/plugin-react-refresh";

// ESM package ("type": "module"), so CommonJS __filename/__dirname are unavailable.
// Rebuild them from import.meta.url — Rspack config paths must be absolute.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The function form of defineConfig receives the CLI env and argv, which is how
// `--mode` from the dev/build scripts reaches this config.
export default defineConfig((_env, argv = {}) => {
  // CLI flag → NODE_ENV → development.
  const mode = argv.mode || process.env.NODE_ENV || "development";
  const isDev = mode === "development";

  return {
    // Base directory for resolving entries and loaders, pinned so the build does
    // not depend on where the command was run from.
    context: __dirname,

    // STANDALONE entry point, ignored when the shell consumes this remote.
    // src/index.tsx contains only `import("./bootstrap")` — the async boundary
    // required by shared React with `eager: false`.
    entry: {
      main: "./src/index.tsx",
    },

    // Selects Rspack's default optimizations for development vs production.
    mode,

    // "web" → browser runtime code. "es2020" → the syntax floor Rspack may leave
    // in the output rather than transpiling away.
    target: ["web", "es2020"],

    output: {
      // Build destination. The deploy workflow copies this to /remotes/analytics/.
      path: path.resolve(__dirname, "dist"),

      // Namespaces this bundle's runtime globals. Five bundles execute in one
      // browser page, and identical names would collide. Must match the federation
      // `name` below and the shell's `remotes` key.
      uniqueName: "analytics",

      // "auto" = work out the asset base URL from the currently executing script.
      // One build serves both localhost:3003 and /remotes/analytics/ on GitHub
      // Pages. Never hardcode publicPath in a remote.
      publicPath: "auto",

      // Empty dist/ before each build so stale hashed assets do not accumulate.
      clean: true,
    },

    resolve: {
      // Extensions tried for extensionless imports, in order.
      // NOTE: no `alias` block in this package. There is no "@", "@components", or
      // "@lib" — imports here are relative ("./lib/theme", "./types"). Adding an
      // alias would also need a matching tsconfig.json `paths` entry, or the build
      // would pass while `pnpm typecheck` fails.
      extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
    },

    module: {
      rules: [
        {
          // ---- TypeScript + JSX ------------------------------------------------
          test: /\.(?:js|mjs|jsx|ts|tsx)$/,

          // Dependencies ship compiled — re-transpiling them would be the largest
          // single cost in the build.
          exclude: /node_modules/,

          use: {
            // "builtin:" = implemented in Rust inside Rspack. No Node.js process,
            // and it replaces babel-loader and ts-loader together.
            loader: "builtin:swc-loader",
            options: {
              // Infer TS vs JSX per file instead of forcing one parser.
              detectSyntax: "auto",
              jsc: {
                transform: {
                  react: {
                    // Modern JSX transform — components need no `import React`.
                    runtime: "automatic",

                    // Development-only helpers (component names, source locations
                    // in errors), stripped from production output.
                    development: isDev,

                    // Emit Fast Refresh hooks. Requires ReactRefreshRspackPlugin
                    // below as well — either one alone does nothing.
                    refresh: isDev,
                  },
                  // Rspack 2.1: Rust port of React Compiler — auto-memoization
                  // at build time, 7-13x faster than the Babel plugin.
                  // ClinicalAnalytics.tsx still uses `memo`/`useMemo` in places for
                  // referential stability; performance memoization is the
                  // compiler's job, not yours.
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
          // Federation-relevant: ClinicalAnalytics.tsx imports "./index.css" itself,
          // because the host never runs this package's bootstrap.tsx. An exposed
          // module that relies on bootstrap for styles looks correct standalone and
          // renders unstyled inside the shell.
          type: "css",

          // Runs first — Tailwind CSS v4 is a PostCSS plugin. Loaders apply
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
        // Container identity. The same string appears in three places: here,
        // `output.uniqueName` above, and the shell's `remotes` key.
        name: "analytics",

        // The manifest the host fetches first, listing what this remote exposes
        // and which shared modules it can provide.
        filename: "remoteEntry.js",

        // ---- exposes: THIS MODULE'S PUBLIC API -------------------------------
        // The contract with the host team. "./ClinicalAnalytics" becomes the
        // specifier `analytics/ClinicalAnalytics` on the shell side.
        //
        // Both are REAL RUNTIME ENTRYPOINTS: each imports its own CSS and stands
        // up with no host, because bootstrap.tsx does not run for them.
        //
        // Renaming a key breaks the host at RUNTIME, not build time — the shell
        // compiles cleanly and shows a "Module Unavailable" card instead.
        exposes: {
          // The plain component — used standalone and by any future host.
          "./ClinicalAnalytics": "./src/ClinicalAnalytics.tsx",

          // The suspending wrapper. THIS is what the shell imports, because
          // analytics is a "streamed" module: skeleton first, content second.
          "./StreamingClinicalAnalytics": "./src/StreamingClinicalAnalytics.tsx",
        },

        // ---- shared: DEDUPLICATION -------------------------------------------
        // Identical in all five packages. Both sides must declare a module as
        // shared for runtime deduplication to happen.
        //
        // This is also the list to extend if this module ever needs a charting
        // library that another remote also uses — otherwise the user downloads
        // that library once per remote.
        shared: {
          react: {
            // Exactly ONE React instance across the page. Without it this remote
            // loads its own React, its hooks resolve against a different dispatcher
            // than the renderer, and the app throws "Invalid hook call".
            singleton: true,

            // Warn rather than throw on a version mismatch, since remotes here
            // deploy independently.
            strictVersion: false,

            // The range used to negotiate which offered copy of React wins.
            requiredVersion: "^19.2.7",

            // Resolve React asynchronously instead of at startup — exactly why
            // src/index.tsx must be `import("./bootstrap")`.
            eager: false,
          },
          "react-dom": {
            singleton: true,
            strictVersion: false,
            requiredVersion: "^19.2.7",
            eager: false,
          },
          // React 18+ made the client renderer its own specifier. Sharing
          // "react-dom" does not include it, so it is declared separately.
          "react-dom/client": {
            singleton: true,
            strictVersion: false,
            requiredVersion: "^19.2.7",
            eager: false,
          },
        },
      }),

      // Generates dist/index.html for STANDALONE mode. Never used inside the shell,
      // where the host's HTML is already rendered.
      new rspack.HtmlRspackPlugin({
        template: "./public/index.html",
        minify: !isDev,
        // Auto-inject script tags — content hashes make hand-written tags impossible.
        inject: true,
      }),

      // Compile-time constant substitution, which lets the minifier drop
      // unreachable branches.
      new rspack.DefinePlugin({
        // JSON.stringify is required: the substituted value must be a QUOTED
        // string, otherwise it lands as a bare identifier and throws at runtime.
        "process.env.NODE_ENV": JSON.stringify(mode),
      }),

      // Fast Refresh runtime, development only. Pairs with `refresh: isDev` above.
      isDev && new ReactRefreshRspackPlugin(),

      // Removes the `false` left behind in production builds.
    ].filter(Boolean),

    optimization: {
      // Minify in production only — the slowest step, and it destroys stack traces.
      minimize: !isDev,

      // No `splitChunks` here by design: only the shell splits chunks, because the
      // host is the shared layer that already provides React to every remote.
      // Worth knowing before adding a heavy dependency to this module — it would
      // land in a single chunk rather than being split out.
    },

    devServer: {
      // Analytics' port. Part of the federation contract: it also appears in the
      // shell's `remoteUrl("analytics", 3003)` call and in the shell's MODULES array.
      port: 3003,

      // Hot Module Replacement — apply edits without a full reload.
      hot: true,

      // Serve index.html for unmatched paths so standalone deep links work.
      historyApiFallback: true,

      // gzip dev server responses.
      compress: true,

      headers: {
        // MANDATORY for federation. The shell on :3000 fetches this remote's
        // remoteEntry.js from :3003 — a different port is a different ORIGIN, so
        // without CORS headers the browser blocks it and the module falls back.
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers":
          "X-Requested-With, content-type, Authorization",
      },

      client: {
        overlay: {
          // Surface compile errors in the browser.
          errors: true,
          // Hide warnings, which would otherwise cover the app.
          warnings: false,
        },
      },

      static: {
        // Serve unprocessed files from public/.
        directory: path.join(__dirname, "public"),
      },
    },

    // "cheap-module-source-map" maps to original lines but not columns — faster to
    // generate and accurate enough for React debugging.
    // Keep source maps useful locally without publishing source to GitHub Pages.
    devtool: isDev ? "cheap-module-source-map" : false,

    // Rspack 2.1: persistent cache with automatic cleanup
    // (maxAge defaults to 7 days, maxVersions defaults to 3).
    // Caches compilation results to disk so cold starts reuse prior work.
    cache: { type: "persistent" },

    // Rspack 2.1 CLI defaults lazyCompilation.imports to true for browser targets.
    // That proxies import("./bootstrap"), which races Module Federation shared React
    // (eager: false) and leaves standalone remotes on a white screen.
    // DO NOT REMOVE — without it, :3003 renders blank.
    lazyCompilation: false,

    // Minimal terminal output; five dev servers share one console.
    stats: "errors-only",

    performance: {
      // Budget warnings in production builds only. Treat a warning here as a
      // failure — nothing else in this repo enforces the budget.
      hints: isDev ? false : "warning",

      // 256 KB, half the shell's budget. This module is loaded ON DEMAND with no
      // prefetch, so its size is felt directly as time on the skeleton. It is also
      // the module most likely to attract a charting library — see
      // .agents/skills/remote-bundle-budget/ before adding one.
      maxAssetSize: 256000,
      maxEntrypointSize: 256000,
    },
  };
});
