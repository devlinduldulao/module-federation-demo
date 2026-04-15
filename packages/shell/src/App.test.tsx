import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { THEME_STORAGE_KEY } from "./lib/theme";

// Mock CSS import
vi.mock("./index.css", () => ({}));

// Mock cn utility
vi.mock("./lib/utils", () => ({
  cn: (...args: unknown[]) =>
    args
      .flat()
      .filter((a) => typeof a === "string" && a.length > 0)
      .join(" "),
}));

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

describe("Shell App", () => {
  let localStorageMock: ReturnType<typeof createStorageMock>;

  beforeEach(() => {
    localStorageMock = createStorageMock();
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      configurable: true,
    });
  });

  // Ensure real timers are always restored between tests
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    localStorageMock.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("style");
    delete window.__MF_THEME__;
  });

  it("renders the MF logo and Demo label", async () => {
    render(<App />);
    expect(screen.getByText("MF")).toBeInTheDocument();
    expect(screen.getByText("Demo")).toBeInTheDocument();
  });

  it("renders all three navigation tabs", async () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /switch to products/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /switch to cart/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /switch to dashboard/i })).toBeInTheDocument();
  });

  it("defaults to Products tab active", async () => {
    render(<App />);
    const productsBtn = screen.getByRole("button", { name: /switch to products/i });
    expect(productsBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("shows the status strip with active module info", async () => {
    render(<App />);
    expect(screen.getByText("STREAMING")).toBeInTheDocument();
    expect(screen.getByText("products")).toBeInTheDocument();
    expect(screen.getByText(":3001")).toBeInTheDocument();
  });

  it("shows tech stack labels in status strip", async () => {
    render(<App />);
    expect(screen.getByText("React 19")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /switch theme to dark/i })
    ).toBeInTheDocument();
  });

  it("restores the saved theme from localStorage on load", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");

    render(<App />);

    expect(
      screen.getByRole("button", { name: /switch theme to light/i })
    ).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.style.getPropertyValue("--color-noir")).toBe(
      "#F3EEE3"
    );
  });

  it("switches to Cart tab on click", async () => {
    const user = userEvent.setup();
    render(<App />);

    const cartBtn = screen.getByRole("button", { name: /switch to cart/i });
    await user.click(cartBtn);

    expect(cartBtn).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("cart")).toBeInTheDocument();
    expect(screen.getByText(":3002")).toBeInTheDocument();
  });

  it("switches to Dashboard tab on click", async () => {
    const user = userEvent.setup();
    render(<App />);

    const dashBtn = screen.getByRole("button", { name: /switch to dashboard/i });
    await user.click(dashBtn);

    expect(dashBtn).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("dashboard")).toBeInTheDocument();
    expect(screen.getByText(":3003")).toBeInTheDocument();
  });

  it("dispatches moduleChange event on tab switch", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    window.addEventListener("moduleChange", handler);

    render(<App />);
    await user.click(screen.getByRole("button", { name: /switch to cart/i }));

    expect(handler).toHaveBeenCalledTimes(1);
    expect((handler.mock.calls[0]![0] as CustomEvent).detail).toEqual({
      newModule: "cart",
    });

    window.removeEventListener("moduleChange", handler);
  });

  it("shows info notification on module switch", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /switch to cart/i }));

    expect(screen.getByText("Cart module loaded")).toBeInTheDocument();
  });

  it("persists and broadcasts theme changes from the shell", async () => {
    const user = userEvent.setup();
    render(<App />);

    const handler = vi.fn();
    window.addEventListener("themeChange", handler);

    await user.click(screen.getByRole("button", { name: /switch theme to dim/i }));

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dim");
    expect(document.documentElement.dataset.theme).toBe("dim");
    expect(
      screen.getByRole("button", { name: /switch theme to dim/i })
    ).toHaveAttribute("aria-pressed", "true");
    expect((handler.mock.calls[0]![0] as CustomEvent).detail).toEqual({
      theme: "dim",
      colorScheme: "dark",
    });

    window.removeEventListener("themeChange", handler);
  });

  it("shows notification from global showNotification event", async () => {
    render(<App />);

    act(() => {
      window.dispatchEvent(
        new CustomEvent("showNotification", {
          detail: { type: "success", message: "Item added!" },
        })
      );
    });

    expect(screen.getByText("Item added!")).toBeInTheDocument();
  });

  it("renders footer with architecture keywords", async () => {
    render(<App />);
    expect(screen.getByText("Independent Deployment")).toBeInTheDocument();
    expect(screen.getByText("Hot Reload")).toBeInTheDocument();
    expect(screen.getByText("Zero Coupling")).toBeInTheDocument();
    expect(screen.getByText("Fault Isolation")).toBeInTheDocument();
  });

  it("shows products skeleton while loading products module", async () => {
    render(<App />);
    // Suspense boundary shows the ProductsSkeleton fallback for default tab
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/loading products/i)).toBeInTheDocument();
  });

  it("shows cart skeleton while loading cart module", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /switch to cart/i }));

    // Suspense boundary shows the CartSkeleton fallback
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/loading cart/i)).toBeInTheDocument();
  });

  it("shows dashboard skeleton while loading dashboard module", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /switch to dashboard/i }));

    // Suspense boundary shows the DashboardSkeleton fallback
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  // Fake timer test isolated at the end to prevent contamination of async React.lazy resolution
  it("auto-removes notifications after 3 seconds", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<App />);

    act(() => {
      window.dispatchEvent(
        new CustomEvent("showNotification", {
          detail: { type: "success", message: "Temporary toast" },
        })
      );
    });

    expect(screen.getByText("Temporary toast")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3100);
    });

    expect(screen.queryByText("Temporary toast")).not.toBeInTheDocument();
  });
});
