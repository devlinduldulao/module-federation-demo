// ============================================================================
// Rstest setup — runs before EVERY test file (see `setupFiles` in rstest.config.ts)
// ----------------------------------------------------------------------------
// Migrated from vitest.setup.ts. Two things changed in the move:
//
//  1. jest-dom registration. Vitest had a dedicated entry point
//     (`@testing-library/jest-dom/vitest`) that self-registered on import.
//     Rstest has no such entry, so the matchers are imported and registered
//     explicitly with `expect.extend()` — this is the documented Rstest approach.
//
//  2. `vi` → `rs`. Rstest's mocking namespace is `rs`, imported from
//     "@rstest/core" instead of "vitest".
// ============================================================================

import { afterEach, expect, rs } from "@rstest/core";
import * as jestDomMatchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";

// Adds toBeInTheDocument, toHaveClass, toBeDisabled, and the rest of the
// jest-dom matcher set to `expect`.
expect.extend(jestDomMatchers);

// jsdom ships no localStorage implementation. The shell's theme layer and the
// remotes' `getThemeFromHost()` fallback both read it, so tests need a real
// working store rather than a stub that returns undefined.
function createStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear: rs.fn(() => {
      store.clear();
    }),
    getItem: rs.fn((key: string) => store.get(key) ?? null),
    key: rs.fn((index: number) => Array.from(store.keys())[index] ?? null),
    removeItem: rs.fn((key: string) => {
      store.delete(key);
    }),
    setItem: rs.fn((key: string, value: string) => {
      store.set(key, String(value));
    }),
  };
}

Object.defineProperty(window, "localStorage", {
  value: createStorageMock(),
  configurable: true,
});

// Every module's SharedStateBar fetches /todos through TanStack Query. Without a
// stub the suite would hit the real network — slow, flaky, and offline-hostile.
// Individual tests can still override this with rs.stubGlobal("fetch", ...).
const TODO_FIXTURE = Array.from({ length: 200 }, (_, index) => ({ id: index + 1 }));

Object.defineProperty(globalThis, "fetch", {
  writable: true,
  configurable: true,
  value: rs.fn(async (input: RequestInfo | URL) => {
    if (String(input).includes("/todos")) {
      return new Response(JSON.stringify(TODO_FIXTURE), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("{}", { status: 200 });
  }),
});

afterEach(() => {
  // Unmount anything Testing Library rendered, so the next test starts on a
  // clean DOM.
  cleanup();
  // Theme state persists to localStorage; clearing it stops one test's theme
  // choice from deciding the next test's initial render.
  window.localStorage.clear();
});
