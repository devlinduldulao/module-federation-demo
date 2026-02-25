const rspack = require("@rspack/core");
const RefreshPlugin = require("@rspack/plugin-react-refresh");
const path = require("path");

const isDev = process.env.NODE_ENV === "development";

/** @type {import('@rspack/cli').Configuration} */
module.exports = {
  context: __dirname,
  entry: {
    main: "./src/index.tsx",
  },
  mode: isDev ? "development" : "production",
  target: "web",

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
    new rspack.container.ModuleFederationPlugin({
      name: "products",
      filename: "remoteEntry.js",
      exposes: {
        "./ProductsCatalog": "./src/ProductsCatalog.tsx",
        "./StreamingProductsCatalog": "./src/StreamingProductsCatalog.tsx",
      },
      shared: {
        react: {
          singleton: true,
          strictVersion: false,
          requiredVersion: "^19.2.4",
          eager: false,
        },
        "react-dom": {
          singleton: true,
          strictVersion: false,
          requiredVersion: "^19.2.4",
          eager: false,
        },
        "react-dom/client": {
          singleton: true,
          strictVersion: false,
          requiredVersion: "^19.2.4",
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
      "process.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV || "development"
      ),
    }),
    isDev && new RefreshPlugin(),
  ].filter(Boolean),

  optimization: {
    minimize: !isDev,
    usedExports: true,
    sideEffects: false,
  },

  devServer: {
    port: 3001,
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
