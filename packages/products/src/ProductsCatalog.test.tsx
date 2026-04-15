import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductsCatalog from "./ProductsCatalog";

vi.mock("./index.css", () => ({}));
vi.mock("./lib/utils", () => ({
  cn: (...args: unknown[]) =>
    args
      .flat()
      .filter((a) => typeof a === "string" && a.length > 0)
      .join(" "),
}));

describe("ProductsCatalog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the header", () => {
    render(<ProductsCatalog />);
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Browse Collection")).toBeInTheDocument();
  });

  it("renders all 8 mock products by default", () => {
    render(<ProductsCatalog />);
    expect(screen.getByText("MacBook Pro M3")).toBeInTheDocument();
    expect(screen.getByText("Designer Hoodie")).toBeInTheDocument();
    expect(screen.getByText("Clean Code")).toBeInTheDocument();
    expect(screen.getByText("iPhone 15 Pro")).toBeInTheDocument();
    expect(screen.getByText("Denim Jacket")).toBeInTheDocument();
    expect(screen.getByText("System Design")).toBeInTheDocument();
    expect(screen.getByText("AirPods Pro")).toBeInTheDocument();
    expect(screen.getByText("Cargo Pants")).toBeInTheDocument();
  });

  it("shows item count", () => {
    render(<ProductsCatalog />);
    expect(screen.getByText("8 items")).toBeInTheDocument();
  });

  it("renders all category filter buttons", () => {
    render(<ProductsCatalog />);
    expect(screen.getByRole("button", { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /electronics/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clothing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /books/i })).toBeInTheDocument();
  });

  it("filters to electronics (3 items)", async () => {
    const user = userEvent.setup();
    render(<ProductsCatalog />);

    await user.click(screen.getByRole("button", { name: /electronics/i }));

    expect(screen.getByText("MacBook Pro M3")).toBeInTheDocument();
    expect(screen.getByText("iPhone 15 Pro")).toBeInTheDocument();
    expect(screen.getByText("AirPods Pro")).toBeInTheDocument();
    expect(screen.queryByText("Designer Hoodie")).not.toBeInTheDocument();
    expect(screen.queryByText("Clean Code")).not.toBeInTheDocument();
    expect(screen.getByText("3 items")).toBeInTheDocument();
  });

  it("filters to clothing (3 items)", async () => {
    const user = userEvent.setup();
    render(<ProductsCatalog />);

    await user.click(screen.getByRole("button", { name: /clothing/i }));

    expect(screen.getByText("Designer Hoodie")).toBeInTheDocument();
    expect(screen.getByText("Denim Jacket")).toBeInTheDocument();
    expect(screen.getByText("Cargo Pants")).toBeInTheDocument();
    expect(screen.queryByText("MacBook Pro M3")).not.toBeInTheDocument();
    expect(screen.getByText("3 items")).toBeInTheDocument();
  });

  it("filters to books (2 items)", async () => {
    const user = userEvent.setup();
    render(<ProductsCatalog />);

    await user.click(screen.getByRole("button", { name: /books/i }));

    expect(screen.getByText("Clean Code")).toBeInTheDocument();
    expect(screen.getByText("System Design")).toBeInTheDocument();
    expect(screen.queryByText("MacBook Pro M3")).not.toBeInTheDocument();
    expect(screen.getByText("2 items")).toBeInTheDocument();
  });

  it("returns to all products when 'all' is clicked", async () => {
    const user = userEvent.setup();
    render(<ProductsCatalog />);

    await user.click(screen.getByRole("button", { name: /electronics/i }));
    expect(screen.getByText("3 items")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /all/i }));
    expect(screen.getByText("8 items")).toBeInTheDocument();
  });

  it("dispatches addToCart and showNotification events on Add click", async () => {
    const user = userEvent.setup();
    const addToCartHandler = vi.fn();
    const notificationHandler = vi.fn();

    window.addEventListener("addToCart", addToCartHandler);
    window.addEventListener("showNotification", notificationHandler);

    render(<ProductsCatalog />);

    await user.click(screen.getByRole("button", { name: /add MacBook Pro M3 to cart/i }));

    expect(addToCartHandler).toHaveBeenCalledTimes(1);
    const cartEvent = addToCartHandler.mock.calls[0]![0] as CustomEvent;
    expect(cartEvent.detail).toEqual({
      id: 1,
      name: "MacBook Pro M3",
      price: 2499.99,
      quantity: 1,
    });

    expect(notificationHandler).toHaveBeenCalledTimes(1);
    const notifEvent = notificationHandler.mock.calls[0]![0] as CustomEvent;
    expect(notifEvent.detail).toEqual({
      type: "success",
      message: "MacBook Pro M3 added to cart",
    });

    window.removeEventListener("addToCart", addToCartHandler);
    window.removeEventListener("showNotification", notificationHandler);
  });

  it("displays product prices", () => {
    render(<ProductsCatalog />);
    expect(screen.getByText("$2,499.99")).toBeInTheDocument();
    expect(screen.getByText("$89.99")).toBeInTheDocument();
    expect(screen.getByText("$45.99")).toBeInTheDocument();
  });

  it("has proper accessibility roles", () => {
    render(<ProductsCatalog />);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /product category filters/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Products grid")).toBeInTheDocument();
  });
});
