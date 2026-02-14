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

  it("renders all 6 mock products by default", () => {
    render(<ProductsCatalog />);
    expect(screen.getByText("Laptop")).toBeInTheDocument();
    expect(screen.getByText("T-Shirt")).toBeInTheDocument();
    expect(screen.getByText("Book")).toBeInTheDocument();
    expect(screen.getByText("Phone")).toBeInTheDocument();
    expect(screen.getByText("Jeans")).toBeInTheDocument();
    expect(screen.getByText("Cookbook")).toBeInTheDocument();
  });

  it("shows item count", () => {
    render(<ProductsCatalog />);
    expect(screen.getByText("6 items")).toBeInTheDocument();
  });

  it("renders all category filter buttons", () => {
    render(<ProductsCatalog />);
    expect(screen.getByRole("button", { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /electronics/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clothing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /books/i })).toBeInTheDocument();
  });

  it("filters to electronics", async () => {
    const user = userEvent.setup();
    render(<ProductsCatalog />);

    await user.click(screen.getByRole("button", { name: /electronics/i }));

    expect(screen.getByText("Laptop")).toBeInTheDocument();
    expect(screen.getByText("Phone")).toBeInTheDocument();
    expect(screen.queryByText("T-Shirt")).not.toBeInTheDocument();
    expect(screen.queryByText("Book")).not.toBeInTheDocument();
    expect(screen.getByText("2 items")).toBeInTheDocument();
  });

  it("filters to clothing", async () => {
    const user = userEvent.setup();
    render(<ProductsCatalog />);

    await user.click(screen.getByRole("button", { name: /clothing/i }));

    expect(screen.getByText("T-Shirt")).toBeInTheDocument();
    expect(screen.getByText("Jeans")).toBeInTheDocument();
    expect(screen.queryByText("Laptop")).not.toBeInTheDocument();
    expect(screen.getByText("2 items")).toBeInTheDocument();
  });

  it("filters to books", async () => {
    const user = userEvent.setup();
    render(<ProductsCatalog />);

    await user.click(screen.getByRole("button", { name: /books/i }));

    expect(screen.getByText("Book")).toBeInTheDocument();
    expect(screen.getByText("Cookbook")).toBeInTheDocument();
    expect(screen.queryByText("Laptop")).not.toBeInTheDocument();
    expect(screen.getByText("2 items")).toBeInTheDocument();
  });

  it("returns to all products when 'all' is clicked", async () => {
    const user = userEvent.setup();
    render(<ProductsCatalog />);

    await user.click(screen.getByRole("button", { name: /electronics/i }));
    expect(screen.getByText("2 items")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /all/i }));
    expect(screen.getByText("6 items")).toBeInTheDocument();
  });

  it("dispatches addToCart and showNotification events on Add click", async () => {
    const user = userEvent.setup();
    const addToCartHandler = vi.fn();
    const notificationHandler = vi.fn();

    window.addEventListener("addToCart", addToCartHandler);
    window.addEventListener("showNotification", notificationHandler);

    render(<ProductsCatalog />);

    await user.click(screen.getByRole("button", { name: /add laptop to cart/i }));

    expect(addToCartHandler).toHaveBeenCalledTimes(1);
    const cartEvent = addToCartHandler.mock.calls[0]![0] as CustomEvent;
    expect(cartEvent.detail).toEqual({
      id: 1,
      name: "Laptop",
      price: 999.99,
      quantity: 1,
    });

    expect(notificationHandler).toHaveBeenCalledTimes(1);
    const notifEvent = notificationHandler.mock.calls[0]![0] as CustomEvent;
    expect(notifEvent.detail).toEqual({
      type: "success",
      message: "Laptop added to cart",
    });

    window.removeEventListener("addToCart", addToCartHandler);
    window.removeEventListener("showNotification", notificationHandler);
  });

  it("displays product prices", () => {
    render(<ProductsCatalog />);
    expect(screen.getByText("$999.99")).toBeInTheDocument();
    expect(screen.getByText("$19.99")).toBeInTheDocument();
    expect(screen.getByText("$12.99")).toBeInTheDocument();
  });

  it("has proper accessibility roles", () => {
    render(<ProductsCatalog />);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /product category filters/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Products grid")).toBeInTheDocument();
  });

  it("uses singular 'item' when filtered to 1 result is possible", async () => {
    // All categories have 2 items, so this specifically tests the plural "items"
    const user = userEvent.setup();
    render(<ProductsCatalog />);
    await user.click(screen.getByRole("button", { name: /electronics/i }));
    expect(screen.getByText("2 items")).toBeInTheDocument();
  });
});
