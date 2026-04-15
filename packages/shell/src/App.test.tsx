import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { THEME_STORAGE_KEY } from "./lib/theme";
import { __resetPrescriptionsStreamingResourceCache } from "prescriptions/StreamingPrescriptionOrders";
import { __resetAnalyticsStreamingResourceCache } from "analytics/StreamingClinicalAnalytics";

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
    window.history.pushState({}, "", "/records");
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    __resetPrescriptionsStreamingResourceCache();
    __resetAnalyticsStreamingResourceCache();
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
    expect(screen.getByRole("link", { name: /navigate to records/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /navigate to prescriptions/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /navigate to analytics/i })).toBeInTheDocument();
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
    expect(screen.getByText("EAGER")).toBeInTheDocument();
    expect(screen.getByText("records")).toBeInTheDocument();
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

  it("switches to the prescriptions route on click", async () => {
    const user = userEvent.setup();
    render(<App />);

    const prescriptionsLink = screen.getByRole("link", { name: /navigate to prescriptions/i });
    await user.click(prescriptionsLink);

    expect(prescriptionsLink).toHaveAttribute("aria-current", "page");
    expect(window.location.pathname).toBe("/prescriptions");
    expect(screen.getByText("prescriptions")).toBeInTheDocument();
    expect(screen.getByText(":3002")).toBeInTheDocument();
  });

  it("switches to the analytics route on click", async () => {
    const user = userEvent.setup();
    render(<App />);

    const analyticsLink = screen.getByRole("link", { name: /navigate to analytics/i });
    await user.click(analyticsLink);

    expect(analyticsLink).toHaveAttribute("aria-current", "page");
    expect(window.location.pathname).toBe("/analytics");
    expect(screen.getByText("analytics")).toBeInTheDocument();
    expect(screen.getByText(":3003")).toBeInTheDocument();
  });

  it("renders the prescriptions module directly from the current URL", async () => {
    window.history.pushState({}, "", "/prescriptions");

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("prescriptions")).toBeInTheDocument();
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
    await user.click(screen.getByRole("link", { name: /navigate to prescriptions/i }));

    expect(handler).toHaveBeenCalledTimes(2);
    expect((handler.mock.calls.at(-1)?.[0] as CustomEvent).detail).toEqual({
      newModule: "prescriptions",
    });

    window.removeEventListener("moduleChange", handler);
  });

  it("navigates when a remote requests a module change", async () => {
    render(<App />);

    act(() => {
      window.dispatchEvent(
        new CustomEvent("navigateToModule", {
          detail: { module: "analytics" },
        })
      );
    });

    await waitFor(() => {
      expect(window.location.pathname).toBe("/analytics");
    });

    expect(screen.getByRole("link", { name: /navigate to analytics/i })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("does not show a page loaded notification on route change", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: /navigate to prescriptions/i }));

    expect(screen.queryByText("Prescriptions module loaded")).not.toBeInTheDocument();
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

  it("renders records immediately without a skeleton (eager strategy)", async () => {
    render(<App />);
    // Records uses the standalone component (no streaming delay), so content
    // renders right away instead of showing a skeleton.
    await waitFor(() => {
      expect(
        screen.getByText("Clinical records across lab results, imaging, and consultations for active patients.")
      ).toBeInTheDocument();
    });
    expect(screen.queryByText(/loading records/i)).not.toBeInTheDocument();
  });

  it("shows prescriptions skeleton while loading the prescriptions module", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: /navigate to prescriptions/i }));

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/streaming prescriptions/i)).toBeInTheDocument();
  });

  it("commits prescriptions navigation immediately and replaces the records page with the prescriptions skeleton", async () => {
    render(<App />);

    // Records renders instantly (eager, no streaming delay)
    await waitFor(() => {
      expect(
        screen.getByText("Clinical records across lab results, imaging, and consultations for active patients.")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("link", { name: /navigate to prescriptions/i }));

    expect(window.location.pathname).toBe("/prescriptions");
    expect(screen.getByText(/streaming prescriptions/i)).toBeInTheDocument();
    expect(
      screen.queryByText("Clinical records across lab results, imaging, and consultations for active patients.")
    ).not.toBeInTheDocument();
  });

  it("shows analytics skeleton while loading the analytics module", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: /navigate to analytics/i }));

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/streaming analytics/i)).toBeInTheDocument();
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
