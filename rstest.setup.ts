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

afterEach(() => {
  // Unmount anything Testing Library rendered, so the next test starts on a
  // clean DOM.
  cleanup();
  // Theme state persists to localStorage; clearing it stops one test's theme
  // choice from deciding the next test's initial render.
  window.localStorage.clear();
});
