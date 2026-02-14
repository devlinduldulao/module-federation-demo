import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShoppingCart from "./ShoppingCart";

vi.mock("./index.css", () => ({}));
vi.mock("./lib/utils", () => ({
  cn: (...args: unknown[]) =>
    args
      .flat()
      .filter((a) => typeof a === "string" && a.length > 0)
      .join(" "),
}));

describe("ShoppingCart", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the header", () => {
    render(<ShoppingCart />);
    expect(screen.getByText("Cart")).toBeInTheDocument();
    expect(screen.getByText("Your Order")).toBeInTheDocument();
  });

  it("renders initial cart items (MacBook + AirPods)", () => {
    render(<ShoppingCart />);
    expect(screen.getByText("MacBook Pro M3")).toBeInTheDocument();
    expect(screen.getByText("AirPods Pro")).toBeInTheDocument();
  });

  it("shows correct item count for initial items", () => {
    render(<ShoppingCart />);
    // 1 MacBook + 2 AirPods = 3 items
    expect(screen.getByText("3 items ready for checkout")).toBeInTheDocument();
  });

  it("shows Order Summary section", () => {
    render(<ShoppingCart />);
    expect(screen.getByText("Order Summary")).toBeInTheDocument();
  });

  it("displays line totals", () => {
    render(<ShoppingCart />);
    // MacBook: 1 × $2499.99 = $2499.99
    expect(screen.getByText("$2499.99")).toBeInTheDocument();
    // AirPods: 2 × $249.99 = $499.98
    expect(screen.getByText("$499.98")).toBeInTheDocument();
  });

  it("calculates correct total", () => {
    render(<ShoppingCart />);
    // Total = 2499.99 + 499.98 = 2999.97
    expect(screen.getByText("$2999.97")).toBeInTheDocument();
  });

  it("increments quantity when + is clicked", async () => {
    const user = userEvent.setup();
    render(<ShoppingCart />);

    const incrementBtn = screen.getByRole("button", {
      name: /increase quantity of MacBook Pro M3/i,
    });
    await user.click(incrementBtn);

    // After increment: MacBook quantity = 2, line total = $4999.98
    expect(screen.getByText("$4999.98")).toBeInTheDocument();
  });

  it("decrements quantity when − is clicked", async () => {
    const user = userEvent.setup();
    render(<ShoppingCart />);

    // AirPods starts at qty 2
    const decrementBtn = screen.getByRole("button", {
      name: /decrease quantity of AirPods Pro/i,
    });
    await user.click(decrementBtn);

    // After decrement: AirPods quantity = 1, line total = $249.99
    expect(screen.getByText("$249.99")).toBeInTheDocument();
  });

  it("does not go below quantity 1", async () => {
    const user = userEvent.setup();
    render(<ShoppingCart />);

    // MacBook starts at qty 1 — decrease button should be disabled
    const decrementBtn = screen.getByRole("button", {
      name: /decrease quantity of MacBook Pro M3/i,
    });
    expect(decrementBtn).toBeDisabled();
  });

  it("removes item when × is clicked", async () => {
    const user = userEvent.setup();
    render(<ShoppingCart />);

    const removeBtn = screen.getByRole("button", {
      name: /remove MacBook Pro M3 from cart/i,
    });
    await user.click(removeBtn);

    expect(screen.queryByText("MacBook Pro M3")).not.toBeInTheDocument();
    expect(screen.getByText("AirPods Pro")).toBeInTheDocument();
  });

  it("shows empty cart state when all items removed", async () => {
    const user = userEvent.setup();
    render(<ShoppingCart />);

    await user.click(screen.getByRole("button", { name: /remove MacBook Pro M3 from cart/i }));
    await user.click(screen.getByRole("button", { name: /remove AirPods Pro from cart/i }));

    expect(screen.getByText("Cart is empty")).toBeInTheDocument();
    expect(screen.getByText(/browse products/i)).toBeInTheDocument();
  });

  it("adds items via addToCart event", () => {
    render(<ShoppingCart />);

    act(() => {
      window.dispatchEvent(
        new CustomEvent("addToCart", {
          detail: { id: 99, name: "Test Widget", price: 42.0, quantity: 1 },
        })
      );
    });

    expect(screen.getByText("Test Widget")).toBeInTheDocument();
  });

  it("increments existing item quantity via addToCart event", () => {
    render(<ShoppingCart />);

    // Add AirPods again (id: 7) — should increment existing qty from 2 to 3
    act(() => {
      window.dispatchEvent(
        new CustomEvent("addToCart", {
          detail: { id: 7, name: "AirPods Pro", price: 249.99, quantity: 1 },
        })
      );
    });

    // AirPods now qty 3 → line total = $749.97
    expect(screen.getByText("$749.97")).toBeInTheDocument();
  });

  it("dispatches showNotification on checkout", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    window.addEventListener("showNotification", handler);

    render(<ShoppingCart />);

    const checkoutBtn = screen.getByRole("button", { name: /checkout/i });
    await user.click(checkoutBtn);

    expect(handler).toHaveBeenCalledTimes(1);
    expect((handler.mock.calls[0]![0] as CustomEvent).detail).toEqual({
      type: "success",
      message: "Checkout feature coming soon!",
    });

    window.removeEventListener("showNotification", handler);
  });

  it("has proper accessibility roles", () => {
    render(<ShoppingCart />);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByLabelText("Cart items")).toBeInTheDocument();
  });

  it("shows free shipping in summary", () => {
    render(<ShoppingCart />);
    expect(screen.getByText("Free")).toBeInTheDocument();
  });
});
