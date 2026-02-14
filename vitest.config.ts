/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import path from "path";

// Pin React to the root-level copy to avoid "Invalid hook call" from duplicate instances
const rootNodeModules = path.resolve(__dirname, "node_modules");

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    include: ["packages/*/src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.{ts,tsx}"],
      exclude: [
        "packages/*/src/index.tsx",
        "packages/*/src/bootstrap.tsx",
        "packages/*/src/**/*.test.*",
        "packages/*/src/types.*",
      ],
    },
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      // Force single React instance — root-level copy
      react: path.join(rootNodeModules, "react"),
      "react-dom/client": path.join(rootNodeModules, "react-dom/client"),
      "react-dom": path.join(rootNodeModules, "react-dom"),

      // Resolve MF remote imports to actual source files for transform
      "products/StreamingProductsCatalog": path.resolve(
        __dirname,
        "packages/products/src/StreamingProductsCatalog.tsx"
      ),
      "products/ProductsCatalog": path.resolve(
        __dirname,
        "packages/products/src/ProductsCatalog.tsx"
      ),
      "cart/StreamingShoppingCart": path.resolve(
        __dirname,
        "packages/cart/src/StreamingShoppingCart.tsx"
      ),
      "cart/ShoppingCart": path.resolve(
        __dirname,
        "packages/cart/src/ShoppingCart.tsx"
      ),
      "dashboard/StreamingUserDashboard": path.resolve(
        __dirname,
        "packages/dashboard/src/StreamingUserDashboard.tsx"
      ),
      "dashboard/UserDashboard": path.resolve(
        __dirname,
        "packages/dashboard/src/UserDashboard.tsx"
      ),
    },
  },
});
