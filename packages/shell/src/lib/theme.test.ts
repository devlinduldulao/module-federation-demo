import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  applyTheme,
  getInitialTheme,
  getStoredTheme,
  isThemeName,
  initializeTheme,
  THEME_DEFINITIONS,
  THEME_STORAGE_KEY,
  DEFAULT_THEME,
} from "./theme";

// Create a proper localStorage mock since Node.js built-in localStorage
// interferes with jsdom's implementation.
function createStorageMock(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", createStorageMock());
});

describe("isThemeName", () => {
  it("returns true for 'dark'", () => {
    expect(isThemeName("dark")).toBe(true);
  });

  it("returns true for 'light'", () => {
    expect(isThemeName("light")).toBe(true);
  });

  it("returns false for invalid values", () => {
    expect(isThemeName("dim")).toBe(false);
    expect(isThemeName("")).toBe(false);
    expect(isThemeName(null)).toBe(false);
    expect(isThemeName(undefined)).toBe(false);
    expect(isThemeName(42)).toBe(false);
  });
});

describe("getStoredTheme", () => {

  it("returns null when nothing is stored", () => {
    expect(getStoredTheme()).toBeNull();
  });

  it("returns the stored theme when valid", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    expect(getStoredTheme()).toBe("light");
  });

  it("returns null when stored value is invalid", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "neon");
    expect(getStoredTheme()).toBeNull();
  });
});

describe("getInitialTheme", () => {

  it("returns stored theme if available", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    expect(getInitialTheme()).toBe("light");
  });

  it("returns default theme when nothing is stored", () => {
    expect(getInitialTheme()).toBe(DEFAULT_THEME);
  });
});

describe("applyTheme", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.cssText = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets data-theme attribute on documentElement", () => {
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("sets color-scheme on documentElement", () => {
    applyTheme("light");
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("applies all CSS variables from the theme definition", () => {
    applyTheme("dark");
    const root = document.documentElement;
    const vars = THEME_DEFINITIONS.dark.variables;
    for (const [variable, value] of Object.entries(vars)) {
      expect(root.style.getPropertyValue(variable)).toBe(value);
    }
  });

  it("persists to localStorage by default", () => {
    applyTheme("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("skips persistence when persist=false", () => {
    applyTheme("light", { persist: false });
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("dispatches themeChange event by default", () => {
    const handler = vi.fn();
    window.addEventListener("themeChange", handler);

    applyTheme("light");

    expect(handler).toHaveBeenCalledTimes(1);
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
    expect(detail).toEqual({
      theme: "light",
      colorScheme: "light",
    });

    window.removeEventListener("themeChange", handler);
  });

  it("skips broadcast when broadcast=false", () => {
    const handler = vi.fn();
    window.addEventListener("themeChange", handler);

    applyTheme("light", { broadcast: false });

    expect(handler).not.toHaveBeenCalled();
    window.removeEventListener("themeChange", handler);
  });

  it("sets window.__MF_THEME__", () => {
    applyTheme("dark");
    expect(window.__MF_THEME__).toBeDefined();
    expect(window.__MF_THEME__!.getTheme()).toBe("dark");
  });
});

describe("initializeTheme", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.cssText = "";
  });

  it("returns the initial theme", () => {
    const theme = initializeTheme();
    expect(isThemeName(theme)).toBe(true);
  });

  it("applies theme without persisting or broadcasting", () => {
    const handler = vi.fn();
    window.addEventListener("themeChange", handler);

    initializeTheme();

    expect(handler).not.toHaveBeenCalled();
    // localStorage should not have been written during init
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();

    window.removeEventListener("themeChange", handler);
  });

  it("applies the theme to the DOM", () => {
    const theme = initializeTheme();
    expect(document.documentElement.dataset.theme).toBe(theme);
  });
});

describe("THEME_DEFINITIONS", () => {
  it("has exactly dark and light themes", () => {
    expect(Object.keys(THEME_DEFINITIONS).sort()).toEqual(["dark", "light"]);
  });

  it("each theme has a label, description, colorScheme, and variables", () => {
    for (const def of Object.values(THEME_DEFINITIONS)) {
      expect(def.label).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(["dark", "light"]).toContain(def.colorScheme);
      expect(Object.keys(def.variables).length).toBeGreaterThan(0);
    }
  });
});
