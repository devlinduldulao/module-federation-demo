import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import UserDashboard from "./UserDashboard";

vi.mock("./index.css", () => ({}));
vi.mock("./lib/utils", () => ({
  cn: (...args: unknown[]) =>
    args
      .flat()
      .filter((a) => typeof a === "string" && a.length > 0)
      .join(" "),
}));

describe("UserDashboard", () => {
  it("renders the header", () => {
    render(<UserDashboard />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Analytics Overview")).toBeInTheDocument();
  });

  it("renders the welcome banner", () => {
    render(<UserDashboard />);
    expect(screen.getByText("Welcome back, Developer")).toBeInTheDocument();
    expect(screen.getByText(/premium member since 2024/i)).toBeInTheDocument();
  });

  it("renders all 4 stat cards", () => {
    render(<UserDashboard />);
    expect(screen.getByText("Total Orders")).toBeInTheDocument();
    expect(screen.getByText("156")).toBeInTheDocument();

    expect(screen.getByText("Total Spent")).toBeInTheDocument();
    expect(screen.getByText("$12,847")).toBeInTheDocument();

    expect(screen.getByText("Money Saved")).toBeInTheDocument();
    expect(screen.getByText("$2,156")).toBeInTheDocument();

    expect(screen.getByText("Wishlist Items")).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();
  });

  it("renders trend percentages", () => {
    render(<UserDashboard />);
    expect(screen.getByText("+23% vs last month")).toBeInTheDocument();
    expect(screen.getByText("+18% vs last month")).toBeInTheDocument();
    expect(screen.getByText("+45% vs last month")).toBeInTheDocument();
    expect(screen.getByText("+12% vs last month")).toBeInTheDocument();
  });

  it("renders the activity stream", () => {
    render(<UserDashboard />);
    expect(screen.getByText("Activity Stream")).toBeInTheDocument();
    expect(screen.getByText("MacBook Pro M3 delivered successfully")).toBeInTheDocument();
    expect(screen.getByText(/Added AirPods Pro to wishlist/i)).toBeInTheDocument();
    expect(screen.getByText(/iPhone 15 Pro order/i)).toBeInTheDocument();
    expect(screen.getByText(/Payment of \$2,749.98/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome bonus/i)).toBeInTheDocument();
  });

  it("renders activity timestamps", () => {
    render(<UserDashboard />);
    expect(screen.getByText("2 hours ago")).toBeInTheDocument();
    expect(screen.getByText("5 hours ago")).toBeInTheDocument();
    expect(screen.getByText("1 day ago")).toBeInTheDocument();
    expect(screen.getByText("2 days ago")).toBeInTheDocument();
    expect(screen.getByText("1 week ago")).toBeInTheDocument();
  });

  it("renders the architecture footer", () => {
    render(<UserDashboard />);
    expect(screen.getByText("Micro-Frontend Architecture")).toBeInTheDocument();
    expect(screen.getByText(/operates independently/i)).toBeInTheDocument();
  });

  it("shows platinum level badge", () => {
    render(<UserDashboard />);
    expect(screen.getByText("Platinum")).toBeInTheDocument();
  });

  it("shows last updated timestamp", () => {
    render(<UserDashboard />);
    expect(screen.getByText(/last updated:/i)).toBeInTheDocument();
  });

  it("has proper accessibility roles", () => {
    render(<UserDashboard />);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByLabelText("Account statistics")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: /recent activities/i })).toBeInTheDocument();
  });

  it("renders performance metrics label", () => {
    render(<UserDashboard />);
    expect(screen.getByText("Performance Metrics")).toBeInTheDocument();
  });
});
