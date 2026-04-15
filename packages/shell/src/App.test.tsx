import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { THEME_STORAGE_KEY } from "./lib/theme";

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

  it("renders all three navigation links", async () => {
    render(<App />);
    expect(screen.getByRole("link", { name: /navigate to products/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /navigate to cart/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /navigate to dashboard/i })).toBeInTheDocument();
  });

  it("redirects the root route to dashboard", async () => {
    window.history.pushState({}, "", "/");

    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe("/dashboard");
    });

    const dashboardLink = screen.getByRole("link", { name: /navigate to dashboard/i });
    expect(dashboardLink).toHaveAttribute("aria-current", "page");
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
    expect(document.documentElement.style.getPropertyValue("--color-noir")).toBe("#F3EEE3");
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

  it("redirects unknown routes to products", async () => {
    window.history.pushState({}, "", "/unknown");

    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe("/products");
    });
    expect(screen.getByText("products")).toBeInTheDocument();
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

  it("shows an info notification on route change", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: /navigate to cart/i }));

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
    expect(screen.getByRole("button", { name: /switch theme to dim/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect((handler.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({
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

    expect(screen.getByText("Temporary toast")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3100);
    });

    expect(screen.queryByText("Temporary toast")).not.toBeInTheDocument();
  });
});
