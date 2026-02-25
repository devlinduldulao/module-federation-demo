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
    new rspack.container.ModuleFederationPlugin({
      name: "shell",
      filename: "remoteEntry.js",
      remotes: {
        products: "products@http://localhost:3001/remoteEntry.js",
        cart: "cart@http://localhost:3002/remoteEntry.js",
        dashboard: "dashboard@http://localhost:3003/remoteEntry.js",
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
