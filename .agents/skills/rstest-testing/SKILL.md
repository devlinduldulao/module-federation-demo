---
name: rstest-testing
description: Write, run, and debug tests in this repo, which uses Rstest (the Rspack-native test runner) rather than Vitest or Jest. Use when adding a test, converting a vi.* API, running a single package's tests, adding a federated module alias for tests, or diagnosing a test that fails to resolve an import.
---

# Testing with Rstest

This repo migrated from Vitest to **[Rstest](https://rstest.rs)**. Rstest builds test files
with Rspack/SWC before running them, so tests compile through the same Rust toolchain as
the apps — there is no second transform pipeline to keep in sync with `rspack.config.ts`.

**Never reintroduce `vitest`, `vi.*`, or `@vitest/*`.** They are uninstalled.

## Layout

| File | Purpose |
|---|---|
| `rstest.config.ts` | Root config. One project covering all five packages. Annotated inline. |
| `rstest.setup.ts` | Runs before every test file: jest-dom matchers, `localStorage` mock, cleanup. |
| `packages/*/src/**/*.test.{ts,tsx}` | Tests, beside the code they cover. |

## Running

```bash
pnpm test                          # all packages (21 files, 211 tests)
pnpm test packages/records/src     # one package
pnpm test:watch                    # watch mode
pnpm test:coverage                 # V8 coverage
pnpm exec rstest run -t "renders"  # filter by test name
pnpm exec rstest list              # list matching tests without running
```

**Do not put `--` before a path filter.** `pnpm test -- packages/records/src` silently
drops the argument under pnpm v11 and runs the entire suite. The per-package
`package.json` scripts were fixed for exactly this. `pnpm test packages/records/src` is
the correct form.

Rstest is **single-run by default** — `rstest` and `rstest run` both run once and exit.
Use `rstest watch` (or `--watch`) for the interactive loop. This is the opposite of
Vitest, where the bare command watches.

## The API

Imports come from `@rstest/core`. The mocking namespace is `rs`.

```ts
import { describe, it, expect, rs, beforeEach, afterEach } from "@rstest/core";
```

`describe`, `it`, `test`, `expect`, `beforeEach`, `afterEach` behave as in Vitest. Every
`vi.*` API has an `rs.*` equivalent with the same name:

| Vitest | Rstest |
|---|---|
| `vi.fn()`, `vi.spyOn()` | `rs.fn()`, `rs.spyOn()` |
| `vi.mock()`, `vi.unmock()` | `rs.mock()`, `rs.unmock()` |
| `vi.clearAllMocks()`, `vi.restoreAllMocks()` | `rs.clearAllMocks()`, `rs.restoreAllMocks()` |
| `vi.useFakeTimers()`, `vi.useRealTimers()` | `rs.useFakeTimers()`, `rs.useRealTimers()` |
| `vi.advanceTimersByTime(Async)()` | `rs.advanceTimersByTime(Async)()` |
| `vi.runAllTimersAsync()` | `rs.runAllTimersAsync()` |
| `vi.stubGlobal()` | `rs.stubGlobal()` |

`rs.mock()` is hoisted, like `vi.mock()`. `rs.doMock()` is the non-hoisted variant.

### jest-dom is registered manually

Rstest has no self-registering `@testing-library/jest-dom/vitest` entry point. The
matchers are added in `rstest.setup.ts`:

```ts
import { expect } from "@rstest/core";
import * as jestDomMatchers from "@testing-library/jest-dom/matchers";

expect.extend(jestDomMatchers);
```

If `toBeInTheDocument()` is suddenly "not a function", that `expect.extend()` call is what
went missing.

## Testing federated modules

`records/MedicalRecords` is resolved at **runtime** by the federation container over HTTP.
In a test there is no container and no dev server, so `rstest.config.ts` maps every
federated specifier to the real file on disk:

```ts
resolve: {
  alias: {
    "records/MedicalRecords": path.resolve(
      import.meta.dirname, "packages/records/src/MedicalRecords.tsx"
    ),
    // ...one line per exposed module
  },
}
```

**Adding an `exposes` entry means adding an alias here.** Otherwise any test that reaches
it fails with a module-resolution error. This is step 3 of the three-file contract change
(`rspack.config.ts` → `packages/shell/src/types.d.ts` → `rstest.config.ts`).

### The duplicate-React trap

Each package installs independently, with its own lockfile, so a test can easily load two
copies of React and fail with "Invalid hook call" — the same failure
`shared: { singleton: true }` prevents in the browser. Two settings prevent it in tests:

```ts
resolve: {
  dedupe: ["react", "react-dom"],
  alias: {
    react: path.join(rootNodeModules, "react"),
    "react-dom/client": path.join(rootNodeModules, "react-dom/client"),
    "react-dom": path.join(rootNodeModules, "react-dom"),
  },
}
```

Order matters: `react-dom/client` is listed before `react-dom` so the more specific path
wins. If you add a package that must be a singleton in tests, add it in both places.

## Testing a streaming component

Streaming wrappers cache their Suspense resource in a module-level `Map`, so the delay
runs once per module load. In tests that means **the second test in a file will not
suspend** unless you clear it:

```tsx
import { __resetRecordsStreamingResourceCache } from "./StreamingMedicalRecords";

beforeEach(() => {
  __resetRecordsStreamingResourceCache();
});
```

Use `rs.useFakeTimers()` and `rs.advanceTimersByTimeAsync()` rather than waiting out the
real 2500 ms delay.

## Conventions

- Query by role and accessible name (`getByRole("button", { name: /submit/i })`), not by
  test id.
- Mock a module with a factory and a relative path — `rs.mock("./lib/utils", () => ({...}))`.
  Paths resolve relative to the file that calls it, which is why a mock of `./lib/utils`
  belongs in the test file rather than in `rstest.setup.ts`.
- Each package's `tsconfig.json` lists `"@rstest/core/globals"` in `compilerOptions.types`.
  A new package needs the same entry or `pnpm typecheck` fails with TS2688.

## Troubleshooting

**`Cannot find type definition file for 'vitest/globals'`** — a `tsconfig.json` still
points at the old types. Replace with `"@rstest/core/globals"`.

**A federated import fails to resolve** — missing alias in `rstest.config.ts`.

**"Invalid hook call" in a test but not the browser** — duplicate React. Check
`resolve.dedupe` and the React aliases above.

**`[MODULE_TYPELESS_PACKAGE_JSON]` / "Reparsing as ES module"** — the root
`package.json` needs `"type": "module"`. It has it; do not remove it.

**A filter runs the whole suite anyway** — you used `--` before the path. Drop it.

**Tests pass individually but fail together** — module-level state leaking across files.
`pool: { type: "forks" }` isolates *files* in separate processes, but state inside one
file persists across its tests. Reset it in `beforeEach`.

## Adding Rstest to a new package

Nothing to do. The root `rstest.config.ts` `include` glob
(`packages/*/src/**/*.test.{ts,tsx}`) picks up any new package automatically. You only
need to add `"@rstest/core/globals"` to that package's `tsconfig.json` types array, and
its federated aliases to `resolve.alias`.
