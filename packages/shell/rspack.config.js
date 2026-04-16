const rspack = require("@rspack/core");
const RefreshPlugin = require("@rspack/plugin-react-refresh");
const path = require("path");

const REMOTE_BASE_URL = process.env.REMOTE_BASE_URL; // set in CI for GitHub Pages
const BASE_PATH = process.env.BASE_PATH || "";

const remoteUrl = (name, devPort) =>
  REMOTE_BASE_URL
    ? `${name}@${REMOTE_BASE_URL}/remotes/${name}/remoteEntry.js`
    : `${name}@http://localhost:${devPort}/remoteEntry.js`;

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
    uniqueName: "shell",
    publicPath: BASE_PATH ? `${BASE_PATH}/` : "auto",
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
      {
        test: /\.(png|jpe?g|gif|svg|ico)$/i,
        type: "asset/resource",
        generator: {
          filename: "images/[name].[hash:8][ext]",
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
        generator: {
          filename: "fonts/[name].[hash:8][ext]",
        },
      },
    ],
  },

  plugins: [
    // ── Module Federation ─────────────────────────────────────────────
    // This plugin is the ONLY config that makes this app a micro-frontend.
    // Everything else (entry, rules, devServer, etc.) is standard Rspack.
    new rspack.container.ModuleFederationPlugin({
      name: "shell",                // unique federation identity (host)
      filename: "remoteEntry.js",

      // RUNTIME DISCOVERY — tells the host where to find each remote's
      // remoteEntry.js at runtime. Format: scope@URL. Each remote is an
      // independently deployed app that the shell stitches together.
      remotes: {
        home: remoteUrl("home", 3004),
        records: remoteUrl("records", 3001),
        prescriptions: remoteUrl("prescriptions", 3002),
        analytics: remoteUrl("analytics", 3003),
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
      "process.env.BASE_PATH": JSON.stringify(BASE_PATH),
    }),
    isDev && new RefreshPlugin(),
  ].filter(Boolean),

  optimization: {
    minimize: !isDev,
    splitChunks: {
      chunks: "async",
      minSize: 20000,
      maxSize: 244000,
      cacheGroups: {
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name: "vendors",
          priority: -10,
          chunks: "all",
          enforce: true,
        },
        react: {
          test: /[\\\\/]node_modules[\\\\/](react|react-dom)[\\\\/]/,
          name: "react",
          priority: 20,
          chunks: "all",
        },
      },
    },
    usedExports: true,
    sideEffects: false,
  },

  devServer: {
    port: 3000,
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
      progress: true,
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
    maxAssetSize: 512000,
    maxEntrypointSize: 512000,
  },
  };
};
