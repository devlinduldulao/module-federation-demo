import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@rspack/cli";
import * as rspack from "@rspack/core";
import { ReactRefreshRspackPlugin } from "@rspack/plugin-react-refresh";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REMOTE_BASE_URL = process.env.REMOTE_BASE_URL;
const BASE_PATH = process.env.BASE_PATH || "";

const remoteUrl = (name: string, devPort: number) =>
  REMOTE_BASE_URL
    ? `${name}@${REMOTE_BASE_URL}/remotes/${name}/remoteEntry.js`
    : `${name}@http://localhost:${devPort}/remoteEntry.js`;

export default defineConfig((_env, argv = {}) => {
  const mode = argv.mode || process.env.NODE_ENV || "development";
  const isDev = mode === "development";

  return {
    context: __dirname,
    entry: {
      main: "./src/index.tsx",
    },
    mode,
    target: ["web", "es2020"],

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
          test: /\.(?:js|mjs|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "builtin:swc-loader",
            options: {
              detectSyntax: "auto",
              jsc: {
                transform: {
                  react: {
                    runtime: "automatic",
                    development: isDev,
                    refresh: isDev,
                  },
                  // Rspack 2.1: Rust port of React Compiler — auto-memoization
                  // at build time, 7-13x faster than the Babel plugin.
                  reactCompiler: true,
                },
              },
            },
          },
        },
        {
          test: /\.css$/,
          type: "css",
          use: ["postcss-loader"],
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
          home: remoteUrl("home", 3004),
          records: remoteUrl("records", 3001),
          prescriptions: remoteUrl("prescriptions", 3002),
          analytics: remoteUrl("analytics", 3003),
        },
        shared: {
          react: {
            singleton: true,
            strictVersion: false,
            requiredVersion: "^19.2.7",
            eager: false,
          },
          "react-dom": {
            singleton: true,
            strictVersion: false,
            requiredVersion: "^19.2.7",
            eager: false,
          },
          "react-dom/client": {
            singleton: true,
            strictVersion: false,
            requiredVersion: "^19.2.7",
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
      isDev && new ReactRefreshRspackPlugin(),
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
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: -10,
            chunks: "all",
            enforce: true,
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: "react",
            priority: 20,
            chunks: "all",
          },
        },
      },
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

    // Keep source maps useful locally without publishing source to GitHub Pages.
    devtool: isDev ? "cheap-module-source-map" : false,
    // Rspack 2.1: persistent cache with automatic cleanup
    // (maxAge defaults to 7 days, maxVersions defaults to 3).
    cache: { type: "persistent" },
    stats: "errors-only",
    performance: {
      hints: isDev ? false : "warning",
      maxAssetSize: 512000,
      maxEntrypointSize: 512000,
    },
  };
});
