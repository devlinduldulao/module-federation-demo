import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

function createStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear: vi.fn(() => {
      store.clear();
    }),
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, String(value));
    }),
  };
}

Object.defineProperty(window, "localStorage", {
  value: createStorageMock(),
  configurable: true,
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

// Stub CSS imports
vi.mock("*.css", () => ({}));

// Stub cn utility across all packages
vi.mock("./lib/utils", () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(" "),
}));
