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
      "react-router-dom": path.join(rootNodeModules, "react-router-dom"),
      sonner: path.join(rootNodeModules, "sonner"),

      // Resolve MF remote imports to actual source files for transform
      "records/StreamingMedicalRecords": path.resolve(
        __dirname,
        "packages/records/src/StreamingMedicalRecords.tsx"
      ),
      "records/MedicalRecords": path.resolve(
        __dirname,
        "packages/records/src/MedicalRecords.tsx"
      ),
      "prescriptions/StreamingPrescriptionOrders": path.resolve(
        __dirname,
        "packages/prescriptions/src/StreamingPrescriptionOrders.tsx"
      ),
      "prescriptions/PrescriptionOrders": path.resolve(
        __dirname,
        "packages/prescriptions/src/PrescriptionOrders.tsx"
      ),
      "analytics/StreamingClinicalAnalytics": path.resolve(
        __dirname,
        "packages/analytics/src/StreamingClinicalAnalytics.tsx"
      ),
      "analytics/ClinicalAnalytics": path.resolve(
        __dirname,
        "packages/analytics/src/ClinicalAnalytics.tsx"
      ),
      "home/StreamingHome": path.resolve(
        __dirname,
        "packages/home/src/StreamingHome.tsx"
      ),
      "home/Home": path.resolve(
        __dirname,
        "packages/home/src/Home.tsx"
      ),
    },
  },
});
