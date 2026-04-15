import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { THEME_STORAGE_KEY } from "./lib/theme";
import { __resetProductsStreamingResourceCache } from "products/StreamingProductsCatalog";
import { __resetCartStreamingResourceCache } from "cart/StreamingShoppingCart";
import { __resetDashboardStreamingResourceCache } from "dashboard/StreamingUserDashboard";
import { __resetHomeStreamingResourceCache } from "home/StreamingHome";

vi.mock("./index.css", () => ({}));

vi.mock("./lib/utils", () => ({
  cn: (...args: unknown[]) =>
    args
      .flat()
      .filter((value) => typeof value === "string" && value.length > 0)
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
    window.history.pushState({}, "", "/products");
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    __resetProductsStreamingResourceCache();
    __resetCartStreamingResourceCache();
    __resetDashboardStreamingResourceCache();
    __resetHomeStreamingResourceCache();
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

  it("renders all four navigation links", async () => {
    render(<App />);
    expect(screen.getByRole("link", { name: /navigate to home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /navigate to products/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /navigate to cart/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /navigate to dashboard/i })).toBeInTheDocument();
  });

  it("renders the home module at the root route", async () => {
    window.history.pushState({}, "", "/");

    render(<App />);

    expect(window.location.pathname).toBe("/");
    const homeLink = screen.getByRole("link", { name: /navigate to home/i });
    expect(homeLink).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("home")).toBeInTheDocument();
    expect(screen.getByText(":3004")).toBeInTheDocument();
  });

  it("shows the status strip with active module info", async () => {
    render(<App />);
    expect(screen.getByText("STREAMING")).toBeInTheDocument();
    expect(screen.getByText("products")).toBeInTheDocument();
    expect(screen.getByText(":3001")).toBeInTheDocument();
  });

  it("shows the tech stack label and theme controls", async () => {
    render(<App />);
    expect(screen.getByText("React 19")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /switch theme to dark/i })).toBeInTheDocument();
  });

  it("restores the saved theme from localStorage on load", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");

    render(<App />);

    expect(screen.getByRole("button", { name: /switch theme to light/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.style.getPropertyValue("--color-noir")).toBe("#FFFFFF");
  });

  it("switches to the cart route on click", async () => {
    const user = userEvent.setup();
    render(<App />);

    const cartLink = screen.getByRole("link", { name: /navigate to cart/i });
    await user.click(cartLink);

    expect(cartLink).toHaveAttribute("aria-current", "page");
    expect(window.location.pathname).toBe("/cart");
    expect(screen.getByText("cart")).toBeInTheDocument();
    expect(screen.getByText(":3002")).toBeInTheDocument();
  });

  it("switches to the dashboard route on click", async () => {
    const user = userEvent.setup();
    render(<App />);

    const dashboardLink = screen.getByRole("link", { name: /navigate to dashboard/i });
    await user.click(dashboardLink);

    expect(dashboardLink).toHaveAttribute("aria-current", "page");
    expect(window.location.pathname).toBe("/dashboard");
    expect(screen.getByText("dashboard")).toBeInTheDocument();
    expect(screen.getByText(":3003")).toBeInTheDocument();
  });

  it("renders the cart module directly from the current URL", async () => {
    window.history.pushState({}, "", "/cart");

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("cart")).toBeInTheDocument();
    });
    expect(screen.getByText(":3002")).toBeInTheDocument();
  });

  it("redirects unknown routes to home", async () => {
    window.history.pushState({}, "", "/unknown");

    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe("/");
    });
    expect(screen.getByText("home")).toBeInTheDocument();
  });

  it("dispatches moduleChange when the route changes", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    window.addEventListener("moduleChange", handler);

    render(<App />);
    await user.click(screen.getByRole("link", { name: /navigate to cart/i }));

    expect(handler).toHaveBeenCalledTimes(2);
    expect((handler.mock.calls.at(-1)?.[0] as CustomEvent).detail).toEqual({
      newModule: "cart",
    });

    window.removeEventListener("moduleChange", handler);
  });

  it("navigates when a remote requests a module change", async () => {
    render(<App />);

    act(() => {
      window.dispatchEvent(
        new CustomEvent("navigateToModule", {
          detail: { module: "dashboard" },
        })
      );
    });

    await waitFor(() => {
      expect(window.location.pathname).toBe("/dashboard");
    });

    expect(screen.getByRole("link", { name: /navigate to dashboard/i })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("does not show a page loaded notification on route change", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: /navigate to cart/i }));

    expect(screen.queryByText("Cart module loaded")).not.toBeInTheDocument();
  });

  it("persists and broadcasts theme changes from the shell", async () => {
    const user = userEvent.setup();
    render(<App />);

    const handler = vi.fn();
    window.addEventListener("themeChange", handler);

    await user.click(screen.getByRole("button", { name: /switch theme to light/i }));

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(screen.getByRole("button", { name: /switch theme to light/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect((handler.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({
      theme: "light",
      colorScheme: "light",
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

    await waitFor(() => {
      expect(screen.getByText("Item added!")).toBeInTheDocument();
    });
  });

  it("renders footer with architecture keywords", async () => {
    render(<App />);
    expect(screen.getByText("Independent Deployment")).toBeInTheDocument();
    expect(screen.getByText("Hot Reload")).toBeInTheDocument();
    expect(screen.getByText("Zero Coupling")).toBeInTheDocument();
    expect(screen.getByText("Fault Isolation")).toBeInTheDocument();
  });

  it("shows products skeleton while loading the products module", async () => {
    render(<App />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/loading products/i)).toBeInTheDocument();
  });

  it("shows cart skeleton while loading the cart module", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: /navigate to cart/i }));

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/loading cart/i)).toBeInTheDocument();
  });

  it("commits cart navigation immediately and replaces the previous page with the cart skeleton", async () => {
    vi.useFakeTimers();

    render(<App />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2600);
    });

    expect(
      screen.getByText("Curated products for developers, designers, and tech enthusiasts.")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /navigate to cart/i }));

    expect(window.location.pathname).toBe("/cart");
    expect(screen.getByText(/loading cart/i)).toBeInTheDocument();
    expect(
      screen.queryByText("Curated products for developers, designers, and tech enthusiasts.")
    ).not.toBeInTheDocument();
  });

  it("shows dashboard skeleton while loading the dashboard module", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: /navigate to dashboard/i }));

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

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

    await waitFor(() => {
      expect(screen.getByText("Temporary toast")).toBeInTheDocument();
    });

    act(() => {
      vi.advanceTimersByTime(4500);
    });

    await waitFor(() => {
      expect(screen.queryByText("Temporary toast")).not.toBeInTheDocument();
    });
  });
});
