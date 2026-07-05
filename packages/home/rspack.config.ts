import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@rspack/cli";
import * as rspack from "@rspack/core";
import { ReactRefreshRspackPlugin } from "@rspack/plugin-react-refresh";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      ],
    },

    plugins: [
      new rspack.container.ModuleFederationPlugin({
        name: "home",
        filename: "remoteEntry.js",
        exposes: {
          "./Home": "./src/Home.tsx",
          "./StreamingHome": "./src/StreamingHome.tsx",
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
      }),
      isDev && new ReactRefreshRspackPlugin(),
    ].filter(Boolean),

    optimization: {
      minimize: !isDev,
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
    // Rspack 2.1: persistent cache with automatic cleanup
    // (maxAge defaults to 7 days, maxVersions defaults to 3).
    cache: { type: "persistent" },
    stats: "errors-only",
    performance: {
      hints: isDev ? false : "warning",
      maxAssetSize: 256000,
      maxEntrypointSize: 256000,
    },
  };
});
