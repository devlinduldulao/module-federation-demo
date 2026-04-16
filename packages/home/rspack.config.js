const rspack = require("@rspack/core");
const RefreshPlugin = require("@rspack/plugin-react-refresh");
const path = require("path");

/** @type {import('@rspack/cli').Configuration} */
module.exports = (_, argv = {}) => {
  const mode = argv.mode || process.env.NODE_ENV || "development";
  const isDev = mode === "development";

  return {
  context: __dirname,
  entry: {
    main: "./src/index.tsx",
  },
  mode,
  target: "web",

  output: {
    path: path.resolve(__dirname, "dist"),
    uniqueName: "home",
    publicPath: "auto",
    clean: true,
  },

  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@components": path.resolve(__dirname, "src/components"),
      "@lib": path.resolve(__dirname, "src/lib"),
    },
  },

  module: {
    rules: [
      {
        test: /\.(jsx?|tsx?)$/,
        use: {
          loader: "builtin:swc-loader",
          options: {
            jsc: {
              parser: {
                syntax: "typescript",
                tsx: true,
              },
              transform: {
                react: {
                  runtime: "automatic",
                  development: isDev,
                  refresh: isDev,
                },
              },
              target: "es2020",
            },
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
              modules: false,
            },
          },
          {
            loader: "postcss-loader",
          },
        ],
        type: "javascript/auto",
      },
    ],
  },

  plugins: [
    // ── Module Federation ─────────────────────────────────────────────
    // This plugin is the ONLY config that makes this app a micro-frontend.
    // Everything else (entry, rules, devServer, etc.) is standard Rspack.
    new rspack.container.ModuleFederationPlugin({
      name: "home",                 // unique federation identity
      filename: "remoteEntry.js",   // manifest file the host fetches at runtime

      // PUBLIC API — the contract this team exposes to other apps
      exposes: {
        "./Home": "./src/Home.tsx",
        "./StreamingHome": "./src/StreamingHome.tsx",
      },

      // SHARED DEPENDENCIES — singleton: true ensures one React instance
      // across the entire federation. Without this, each remote loads its
      // own React copy and hooks break with "Invalid hook call" errors.
      // eager: false means React loads asynchronously — this is why
      // index.tsx must use import("./bootstrap") as an async boundary.
      shared: {
        react: {
          singleton: true,
          strictVersion: false,
          requiredVersion: "^19.2.5",
          eager: false,
        },
        "react-dom": {
          singleton: true,
          strictVersion: false,
          requiredVersion: "^19.2.5",
          eager: false,
        },
        "react-dom/client": {
          singleton: true,
          strictVersion: false,
          requiredVersion: "^19.2.5",
          eager: false,
        },
      },
    }),
    new rspack.HtmlRspackPlugin({
      template: "./public/index.html",
      minify: !isDev,
      inject: true,
    }),
    new rspack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(mode),
    }),
    isDev && new RefreshPlugin(),
  ].filter(Boolean),

  optimization: {
    minimize: !isDev,
    usedExports: true,
    sideEffects: false,
  },

  devServer: {
    port: 3004,
    hot: true,
    historyApiFallback: true,
    compress: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers":
        "X-Requested-With, content-type, Authorization",
    },
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
    static: {
      directory: path.join(__dirname, "public"),
    },
  },

  devtool: isDev ? "cheap-module-source-map" : "source-map",

  cache: true,

  stats: "errors-only",

  performance: {
    hints: isDev ? false : "warning",
    maxAssetSize: 256000,
    maxEntrypointSize: 256000,
  },
  };
};
