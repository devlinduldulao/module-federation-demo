// ============================================================================
// SHELL — the HOST application of the federation
// ----------------------------------------------------------------------------
// This is the only package that CONSUMES remotes. It exposes nothing itself.
// Everything below is ordinary Rspack configuration EXCEPT `ModuleFederationPlugin`,
// which is the single plugin that turns five separate apps into one running app.
// ============================================================================

import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@rspack/cli";
import * as rspack from "@rspack/core";
import { ReactRefreshRspackPlugin } from "@rspack/plugin-react-refresh";

// This package is ESM ("type": "module" in package.json), so Node's CommonJS
// globals __filename/__dirname do not exist. We reconstruct them from import.meta.url
// because Rspack config paths must be absolute.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set by the GitHub Pages deploy workflow. Locally both are undefined, and the
// config falls back to localhost URLs — that is how one config serves both environments.
//   REMOTE_BASE_URL — where the remotes are published in production
//   BASE_PATH       — the subdirectory the site is served from (e.g. "/module-federation-demo")
const REMOTE_BASE_URL = process.env.REMOTE_BASE_URL;
const BASE_PATH = process.env.BASE_PATH || "";

// Builds a Module Federation remote specifier: "<scope>@<url-to-remoteEntry.js>".
// The scope on the left MUST match the remote's own `name` and `output.uniqueName`,
// or the runtime cannot find the container it just downloaded.
const remoteUrl = (name: string, devPort: number) =>
  REMOTE_BASE_URL
    ? `${name}@${REMOTE_BASE_URL}/remotes/${name}/remoteEntry.js`
    : `${name}@http://localhost:${devPort}/remoteEntry.js`;

// `defineConfig` gives full TypeScript autocompletion on the object below.
// The function form receives the CLI env and argv, which is how we read `--mode`.
export default defineConfig((_env, argv = {}) => {
  // Resolution order: explicit CLI flag → NODE_ENV → development.
  // `pnpm dev` passes --mode development, `pnpm build` passes --mode production.
  const mode = argv.mode || process.env.NODE_ENV || "development";
  const isDev = mode === "development";

  return {
    // The base directory Rspack resolves entry points and loaders from.
    // Set explicitly so the build behaves identically no matter which directory
    // the command was launched from (the root scripts `cd` into each package).
    context: __dirname,

    // The entry point. `main` is the chunk name, "./src/index.tsx" is the file.
    // Note what src/index.tsx contains: nothing but `import("./bootstrap")`.
    // That dynamic import is the ASYNC BOUNDARY — mandatory, because shared React
    // is declared `eager: false` below and must be resolved asynchronously.
    entry: {
      main: "./src/index.tsx",
    },

    // "development" enables readable output and dev-time warnings.
    // "production" enables minification and tree shaking. Rspack applies a large
    // set of defaults based on this single value.
    mode,

    // The compilation target. "web" selects browser-appropriate runtime code
    // (fetch-based chunk loading, `document` available). "es2020" tells Rspack how
    // far it may down-level syntax — allowing native optional chaining, dynamic
    // import, and BigInt to survive into the output instead of being transpiled away.
    target: ["web", "es2020"],

    output: {
      // Absolute path where the build is emitted.
      path: path.resolve(__dirname, "dist"),

      // Namespaces this build's internal runtime globals. In Module Federation this
      // is critical: five bundles run in ONE browser page, and without a unique name
      // their chunk-loading globals would collide and overwrite each other.
      uniqueName: "shell",

      // The public URL prefix prepended to every asset request at runtime.
      //   "auto"        — infer it from the currently executing script's URL
      //   `${BASE_PATH}/` — an explicit prefix, needed because GitHub Pages serves
      //                     this app from a repository subdirectory, not the domain root
      publicPath: BASE_PATH ? `${BASE_PATH}/` : "auto",

      // Empty the output directory before each build, so deleted files and stale
      // content-hashed assets do not linger in dist/.
      clean: true,
    },

    resolve: {
      // Extensions Rspack tries when an import has none: `./App` finds `./App.tsx`.
      // Order matters — the first match wins. Keep this list short; every extension
      // is an extra filesystem probe on every extensionless import.
      extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],

      // Import shortcuts, so deep files can use "@/lib/utils" instead of "../../lib/utils".
      // These must be mirrored in tsconfig.json `paths`, or the build succeeds while
      // `pnpm typecheck` fails. (Present in shell, home, and records only — the
      // prescriptions and analytics packages deliberately use relative imports.)
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@components": path.resolve(__dirname, "src/components"),
        "@lib": path.resolve(__dirname, "src/lib"),
      },
    },

    module: {
      // Each rule says: "for files matching `test`, apply this loader / treat as this type".
      rules: [
        {
          // ---- TypeScript + JSX ------------------------------------------------
          test: /\.(?:js|mjs|jsx|ts|tsx)$/,

          // Skip dependencies. They ship pre-compiled, and transpiling them again
          // would be the single biggest cost in the build.
          exclude: /node_modules/,

          use: {
            // `builtin:` means this loader is implemented in Rust inside Rspack —
            // no Node.js process, no babel-loader. This is the main reason Rspack
            // builds are fast. It replaces babel-loader AND ts-loader.
            loader: "builtin:swc-loader",
            options: {
              // Let SWC infer TS vs JSX per file instead of forcing one parser
              // across the whole rule. Rspack 2 default; stated here explicitly.
              detectSyntax: "auto",
              jsc: {
                transform: {
                  react: {
                    // The modern JSX transform: the compiler injects `jsx()` from
                    // react/jsx-runtime, so files do not need `import React`.
                    runtime: "automatic",

                    // Emit development-only helpers (component names, source
                    // locations in errors). Off in production to save bytes.
                    development: isDev,

                    // Emit React Fast Refresh hooks so component state survives
                    // edits. Pairs with ReactRefreshRspackPlugin below — BOTH are
                    // required; either one alone does nothing.
                    refresh: isDev,
                  },
                  // Rspack 2.1: Rust port of React Compiler — auto-memoization
                  // at build time, 7-13x faster than the Babel plugin.
                  // Practical consequence: do NOT hand-write useMemo/useCallback/
                  // React.memo for performance. The compiler already did it.
                  reactCompiler: true,
                },
              },
            },
          },
        },
        {
          // ---- CSS -------------------------------------------------------------
          test: /\.css$/,

          // `type: "css"` is Rspack's NATIVE CSS pipeline. It replaces the classic
          // style-loader + css-loader pair entirely — parsing, minification, and
          // injection all happen in Rust.
          type: "css",

          // postcss-loader still runs first, because Tailwind CSS v4 is a PostCSS
          // plugin (@tailwindcss/postcss, configured in postcss.config.cjs).
          // Loaders run right-to-left: postcss-loader → Rspack's native CSS handling.
          use: ["postcss-loader"],
        },
        {
          // ---- Images ----------------------------------------------------------
          test: /\.(png|jpe?g|gif|svg|ico)$/i,

          // Asset Module: emit the file as-is and give the importer its URL.
          // The alternative, "asset/inline", would base64 it into the JS bundle.
          type: "asset/resource",

          generator: {
            // Output naming. `[hash:8]` is a content hash: the filename changes only
            // when the bytes change, which makes these safe to cache forever.
            filename: "images/[name].[hash:8][ext]",
          },
        },
        {
          // ---- Fonts -----------------------------------------------------------
          // Same treatment as images. Fonts are always emitted, never inlined —
          // inlining a variable font would add hundreds of KB to the JS bundle.
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: "asset/resource",
          generator: {
            filename: "fonts/[name].[hash:8][ext]",
          },
        },
      ],
    },

    plugins: [
      // ======================================================================
      // THE ONE PLUGIN THAT MAKES THIS A MICRO-FRONTEND
      // Remove it and you have five ordinary, unrelated React apps.
      // ======================================================================
      new rspack.container.ModuleFederationPlugin({
        // This container's identity on the network. Must match `output.uniqueName`.
        name: "shell",

        // The manifest file other apps would fetch to consume THIS app.
        // The shell exposes nothing today, so nobody reads it — it is kept so the
        // host can become a remote later without a config change.
        filename: "remoteEntry.js",

        // ---- remotes: RUNTIME DISCOVERY (host side of the contract) ----------
        // A map of import-prefix → "scope@url". At build time Rspack does NOT
        // resolve these; it emits code that fetches the URL at runtime. That is why
        // `import("records/MedicalRecords")` compiles even with the remote offline —
        // and why a typo here fails in the browser, not in the build.
        remotes: {
          home: remoteUrl("home", 3004),
          records: remoteUrl("records", 3001),
          prescriptions: remoteUrl("prescriptions", 3002),
          analytics: remoteUrl("analytics", 3003),
        },

        // ---- shared: DEDUPLICATION (both sides of the contract) --------------
        // Declares which dependencies must NOT be duplicated across the federation.
        // All five packages declare the same three React entries identically.
        shared: {
          react: {
            // Exactly ONE instance of React in the page, no matter how many remotes
            // load. Without this, each remote brings its own React, the hooks
            // dispatcher differs between them, and you get "Invalid hook call".
            // This is the single most important line in the whole config.
            singleton: true,

            // Do not hard-fail when versions differ slightly — warn and continue.
            // With `true`, a 19.2.7 vs 19.2.8 mismatch would crash the page. Remotes
            // deploy independently here, so exact lockstep is not realistic.
            strictVersion: false,

            // The version range this app needs. Used to negotiate which copy wins
            // when several bundles offer React: the highest satisfying version.
            requiredVersion: "^19.2.7",

            // Load React lazily, alongside the code that needs it — NOT synchronously
            // at startup. This is precisely why src/index.tsx must be
            // `import("./bootstrap")`. Setting this to `true` would remove the need
            // for the async boundary but bloat every entry bundle.
            eager: false,
          },
          "react-dom": {
            singleton: true,
            strictVersion: false,
            requiredVersion: "^19.2.7",
            eager: false,
          },
          // React 18+ made the client renderer a SEPARATE module specifier.
          // It must be shared explicitly — sharing "react-dom" does not cover it,
          // and forgetting it is a classic source of duplicate-React bugs.
          "react-dom/client": {
            singleton: true,
            strictVersion: false,
            requiredVersion: "^19.2.7",
            eager: false,
          },
        },
      }),

      // Generates dist/index.html from the template and injects the built script
      // tags. Rspack's Rust implementation of html-webpack-plugin.
      new rspack.HtmlRspackPlugin({
        // Source template. Must contain the <div id="root"> that bootstrap.tsx mounts into.
        template: "./public/index.html",

        // Strip whitespace and comments in production only — keeps dev HTML readable.
        minify: !isDev,

        // Automatically insert <script> tags for the emitted bundles. Without this
        // you would hand-write them, and content hashes would make that impossible.
        inject: true,
      }),

      // Compile-time constant replacement: these strings are literally substituted
      // into the source before bundling, which lets the minifier delete dead branches.
      new rspack.DefinePlugin({
        // Libraries branch on this to strip development warnings in production.
        // JSON.stringify is required — the value must be a QUOTED string in the
        // output, otherwise it substitutes a bare identifier and throws at runtime.
        "process.env.NODE_ENV": JSON.stringify(mode),

        // Makes the deploy subdirectory readable from application code, so the
        // router can be configured with the right basename.
        "process.env.BASE_PATH": JSON.stringify(BASE_PATH),
      }),

      // React Fast Refresh: swap edited components in place, preserving state.
      // Development only — it injects a runtime that has no place in production.
      // Requires `jsc.transform.react.refresh: true` above to have any effect.
      isDev && new ReactRefreshRspackPlugin(),

      // The line above evaluates to `false` in production. `.filter(Boolean)` drops
      // it, because Rspack rejects a `false` entry in the plugins array.
    ].filter(Boolean),

    optimization: {
      // Minify (SWC-based, in Rust) in production only. Disabled in development
      // because it is the slowest part of the build and destroys stack traces.
      minimize: !isDev,

      // ---- Code splitting: configured in the HOST ONLY ----------------------
      // The four remotes deliberately leave this alone. The host is the shared
      // layer, so it is the one that benefits from carving out vendor chunks.
      splitChunks: {
        // Which chunks are eligible. "async" = only dynamically imported ones,
        // which is exactly how every remote and route enters this app.
        chunks: "async",

        // Do not bother creating a separate chunk below 20 KB — an extra HTTP
        // request costs more than the bytes saved.
        minSize: 20000,

        // Try to break chunks larger than ~244 KB into smaller pieces. Smaller
        // chunks parallelize better over HTTP/2 and invalidate less on redeploy.
        maxSize: 244000,

        // Named grouping rules. Highest `priority` wins when a module matches
        // more than one group.
        cacheGroups: {
          // Application code imported by 2+ chunks gets hoisted out so it is
          // downloaded once instead of being duplicated into each chunk.
          default: {
            minChunks: 2,
            priority: -20,
            // If an existing chunk already contains this module, point at it
            // instead of creating a duplicate.
            reuseExistingChunk: true,
          },

          // Everything from node_modules → a single "vendors" chunk. Dependencies
          // change far less often than app code, so this chunk stays cached across
          // deploys.
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: -10,
            // Override the outer `chunks: "async"` — include synchronous imports too.
            chunks: "all",
            // Create this chunk even if minSize/maxSize rules say otherwise.
            enforce: true,
          },

          // React gets its OWN chunk, at higher priority than `vendor` so it is
          // matched first. React is the most stable dependency in the app and the
          // one shared with every remote — isolating it maximizes cache hits.
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: "react",
            priority: 20,
            chunks: "all",
          },
        },
      },
    },

    // Development server only — none of this exists in a production build.
    devServer: {
      // The host runs on 3000; remotes occupy 3001-3004. These ports are part of
      // the federation contract (see `remoteUrl` calls above and MODULES in App.tsx).
      port: 3000,

      // Hot Module Replacement: apply changes without a full page reload.
      hot: true,

      // Serve index.html for any unmatched path. Required for client-side routing —
      // without it, refreshing on /records returns a 404 from the dev server.
      historyApiFallback: true,

      // gzip the dev server's responses.
      compress: true,

      headers: {
        // CRITICAL for Module Federation. The host on :3000 fetches remoteEntry.js
        // from :3001-:3004 — different ports are different ORIGINS, so without CORS
        // headers the browser blocks every remote and every module falls back.
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers":
          "X-Requested-With, content-type, Authorization",
      },

      client: {
        // The full-screen error overlay in the browser.
        overlay: {
          // Show compile errors — you want these in your face.
          errors: true,
          // Hide warnings — otherwise the overlay covers the app constantly.
          warnings: false,
        },
        // Show a compilation progress indicator in the browser. Host only —
        // with five dev servers running, this is the one you are watching.
        progress: true,
      },

      static: {
        // Serve files from public/ that are not processed by the build
        // (favicons, robots.txt, and anything referenced by absolute URL).
        directory: path.join(__dirname, "public"),
      },
    },

    // Source maps. "cheap-module-source-map" maps to original source lines but not
    // columns — noticeably faster to generate and accurate enough for React debugging.
    // Keep source maps useful locally without publishing source to GitHub Pages.
    devtool: isDev ? "cheap-module-source-map" : false,

    // Rspack 2.1: persistent cache with automatic cleanup
    // (maxAge defaults to 7 days, maxVersions defaults to 3).
    // Caches compilation results to disk, so a cold dev-server start reuses the
    // previous run's work instead of rebuilding from scratch.
    cache: { type: "persistent" },

    // Rspack 2.1 CLI defaults lazyCompilation.imports to true for browser targets.
    // That proxies import("./bootstrap"), which races Module Federation shared React
    // (eager: false) and leaves standalone remotes on a white screen.
    // DO NOT REMOVE THIS LINE. It is disabled on purpose in all five packages.
    lazyCompilation: false,

    // How much the terminal prints. "errors-only" keeps five concurrent dev servers
    // readable — anything more and the real error scrolls away.
    stats: "errors-only",

    performance: {
      // Warn when an asset exceeds the budgets below. Silenced in development,
      // where unminified bundles always blow past them.
      hints: isDev ? false : "warning",

      // 512 KB — double the remotes' 256 KB budget, because the host carries the
      // shared React runtime and the router on behalf of the whole federation.
      maxAssetSize: 512000,
      maxEntrypointSize: 512000,
    },
  };
});
