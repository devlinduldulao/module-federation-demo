// ============================================================================
// RSTEST — one test project covering all five packages
// ----------------------------------------------------------------------------
// Rstest is the Rspack-native test runner (rstest.rs). It builds test files with
// Rspack/SWC before running them, which means tests compile through the same
// Rust toolchain the apps do — no second transform pipeline to keep in sync.
//
// Migrated from vitest.config.ts. Key shape difference: Vitest nests everything
// under a `test` key, Rstest puts those options at the TOP LEVEL and keeps
// build-time options (`plugins`, `resolve`, `source`, `output`) alongside them.
// ============================================================================

import path from "node:path";

import { pluginReact } from "@rsbuild/plugin-react";
import { defineConfig } from "@rstest/core";

// Pin React to the root-level copy to avoid "Invalid hook call" from duplicate instances
const rootNodeModules = path.resolve(import.meta.dirname, "node_modules");

export default defineConfig({
  // Rstest builds with Rsbuild under the hood, so JSX needs the React plugin.
  // This is the test-time counterpart to `builtin:swc-loader` with
  // `jsc.transform.react` in each package's rspack.config.ts.
  plugins: [pluginReact()],

  // Was `test.globals` in Vitest. Injects describe/it/expect/beforeEach/afterEach
  // plus `rs` (the mocking namespace) as globals. Test files still import them
  // explicitly — the flag exists so setup code and third-party matchers work.
  globals: true,

  // Was `test.environment: "jsdom"`. Renamed to `testEnvironment` in Rstest.
  // Accepts "node" | "jsdom" | "happy-dom". jsdom is a peer dependency and is
  // already installed at the root.
  testEnvironment: "jsdom",

  // Was `test.pool: "forks"` (a bare string in Vitest). In Rstest, `pool` is an
  // object. "forks" runs each test file in a child_process.fork — the isolation
  // that keeps five packages' module-level caches from leaking into each other.
  pool: {
    type: "forks",
  },

  // Was `test.setupFiles`. Runs before each test file. Registers the jest-dom
  // matchers, the localStorage mock, and Testing Library cleanup.
  setupFiles: ["./rstest.setup.ts"],

  // Was `test.include`. One glob covering every package — this single root
  // project is what lets `pnpm test` verify the whole federation at once.
  include: ["packages/*/src/**/*.test.{ts,tsx}"],

  coverage: {
    // Vitest used @vitest/coverage-v8; Rstest's equivalent package is
    // @rstest/coverage-v8. Same V8 engine, different wrapper.
    provider: "v8",
    include: ["packages/*/src/**/*.{ts,tsx}"],
    exclude: [
      // Entry points are one line (`import("./bootstrap")`) and bootstrap files
      // only mount the app — nothing to assert, and they would skew coverage.
      "packages/*/src/index.tsx",
      "packages/*/src/bootstrap.tsx",
      "packages/*/src/**/*.test.*",
      "packages/*/src/types.*",
    ],
  },

  // In Vitest this was a top-level `resolve` block. Rstest keeps the same idea
  // but it is Rspack's resolver doing the work.
  resolve: {
    // Force these packages to resolve from the root node_modules, even when a
    // package has its own copy. Each package here installs independently (five
    // separate lockfiles), so without this a test could load two Reacts and fail
    // with "Invalid hook call" — the same failure mode `shared: { singleton: true }`
    // prevents at runtime in the browser.
    dedupe: ["react", "react-dom"],

    alias: {
      // Belt-and-braces with `dedupe` above: point the specifiers at the exact
      // root copy. Order matters — "react-dom/client" is listed before
      // "react-dom" so the more specific path wins.
      react: path.join(rootNodeModules, "react"),
      "react-dom/client": path.join(rootNodeModules, "react-dom/client"),
      "react-dom": path.join(rootNodeModules, "react-dom"),
      "react-router-dom": path.join(rootNodeModules, "react-router-dom"),
      sonner: path.join(rootNodeModules, "sonner"),

      // ---- Module Federation specifiers -----------------------------------
      // In the browser, "records/MedicalRecords" is resolved at RUNTIME by the
      // federation container over HTTP. There is no bundler in a test, and no
      // dev server to fetch remoteEntry.js from — so each federated specifier is
      // mapped straight to the real source file on disk.
      //
      // This is what lets the shell's App.test.tsx render actual remote
      // components instead of stubs.
      //
      // IMPORTANT: adding a new `exposes` entry to any remote means adding a
      // matching line here, or every test importing it fails to resolve.
      "records/StreamingMedicalRecords": path.resolve(
        import.meta.dirname,
        "packages/records/src/StreamingMedicalRecords.tsx"
      ),
      "records/MedicalRecords": path.resolve(
        import.meta.dirname,
        "packages/records/src/MedicalRecords.tsx"
      ),
      "prescriptions/StreamingPrescriptionOrders": path.resolve(
        import.meta.dirname,
        "packages/prescriptions/src/StreamingPrescriptionOrders.tsx"
      ),
      "prescriptions/PrescriptionOrders": path.resolve(
        import.meta.dirname,
        "packages/prescriptions/src/PrescriptionOrders.tsx"
      ),
      "analytics/StreamingClinicalAnalytics": path.resolve(
        import.meta.dirname,
        "packages/analytics/src/StreamingClinicalAnalytics.tsx"
      ),
      "analytics/ClinicalAnalytics": path.resolve(
        import.meta.dirname,
        "packages/analytics/src/ClinicalAnalytics.tsx"
      ),
      "home/StreamingHome": path.resolve(
        import.meta.dirname,
        "packages/home/src/StreamingHome.tsx"
      ),
      "home/Home": path.resolve(
        import.meta.dirname,
        "packages/home/src/Home.tsx"
      ),
    },
  },
});
