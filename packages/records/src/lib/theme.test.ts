import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useActiveTheme } from "./theme";

function createStorageMock() {
    const store = new Map<string, string>();
    return {
        getItem: vi.fn((key: string) => store.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
            store.set(key, value);
        }),
        removeItem: vi.fn((key: string) => {
            store.delete(key);
        }),
        clear: vi.fn(() => {
            store.clear();
        }),
    };
}

describe("useActiveTheme", () => {
    let storageMock: ReturnType<typeof createStorageMock>;

    beforeEach(() => {
        storageMock = createStorageMock();
        Object.defineProperty(window, "localStorage", {
            value: storageMock,
            configurable: true,
        });
        delete window.__MF_THEME__;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns dark theme by default when nothing is stored", () => {
        const { result } = renderHook(() => useActiveTheme());
        expect(result.current.theme).toBe("dark");
        expect(result.current.label).toBe("Dark");
    });

    it("reads light theme from localStorage", () => {
        storageMock.getItem.mockReturnValue("light");
        const { result } = renderHook(() => useActiveTheme());
        expect(result.current.theme).toBe("light");
        expect(result.current.label).toBe("Light");
    });

    it("reads dark theme from localStorage", () => {
        storageMock.getItem.mockReturnValue("dark");
        const { result } = renderHook(() => useActiveTheme());
        expect(result.current.theme).toBe("dark");
    });

    it("prefers window.__MF_THEME__ over localStorage", () => {
        storageMock.getItem.mockReturnValue("light");
        window.__MF_THEME__ = { getTheme: () => "dark", setTheme: vi.fn() };
        const { result } = renderHook(() => useActiveTheme());
        expect(result.current.theme).toBe("dark");
    });

    it("falls back to localStorage when __MF_THEME__ returns invalid value", () => {
        storageMock.getItem.mockReturnValue("light");
        // @ts-expect-error testing invalid value
        window.__MF_THEME__ = { getTheme: () => "invalid", setTheme: vi.fn() };
        const { result } = renderHook(() => useActiveTheme());
        expect(result.current.theme).toBe("light");
    });

    it("falls back to dark when stored value is not a valid theme name", () => {
        storageMock.getItem.mockReturnValue("cyberpunk");
        const { result } = renderHook(() => useActiveTheme());
        expect(result.current.theme).toBe("dark");
    });

    it("updates to light when a themeChange event is dispatched", () => {
        const { result } = renderHook(() => useActiveTheme());
        expect(result.current.theme).toBe("dark");

        act(() => {
            window.dispatchEvent(
                new CustomEvent("themeChange", {
                    detail: { theme: "light", colorScheme: "light" },
                })
            );
        });

        expect(result.current.theme).toBe("light");
        expect(result.current.label).toBe("Light");
    });

    it("updates to dark when a themeChange event dispatches dark", () => {
        storageMock.getItem.mockReturnValue("light");
        const { result } = renderHook(() => useActiveTheme());
        expect(result.current.theme).toBe("light");

        act(() => {
            window.dispatchEvent(
                new CustomEvent("themeChange", {
                    detail: { theme: "dark", colorScheme: "dark" },
                })
            );
        });

        expect(result.current.theme).toBe("dark");
        expect(result.current.label).toBe("Dark");
    });

    it("removes the themeChange event listener on unmount", () => {
        const removeSpy = vi.spyOn(window, "removeEventListener");
        const { unmount } = renderHook(() => useActiveTheme());
        unmount();
        expect(removeSpy).toHaveBeenCalledWith("themeChange", expect.any(Function));
    });
});
