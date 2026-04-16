import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AnalyticsSkeleton from "./AnalyticsSkeleton";

describe("AnalyticsSkeleton", () => {
    it("renders with role status for screen readers", () => {
        render(<AnalyticsSkeleton />);
        expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("renders the sr-only streaming text including the port", () => {
        render(<AnalyticsSkeleton />);
        expect(screen.getByText("STREAMING ANALYTICS :3003")).toBeInTheDocument();
    });

    it("has animate-pulse on the root element", () => {
        const { container } = render(<AnalyticsSkeleton />);
        expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    it("renders 4 stat card skeletons", () => {
        const { container } = render(<AnalyticsSkeleton />);
        // Stats grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
        const statsGrid = container.querySelector(".grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4");
        expect(statsGrid).toBeInTheDocument();
        expect(statsGrid!.children).toHaveLength(4);
    });

    it("renders 6 activity feed row skeletons", () => {
        const { container } = render(<AnalyticsSkeleton />);
        // Each activity row has: flex items-start gap-4 py-4 border-b border-edge
        const rows = container.querySelectorAll(".py-4.border-b.border-edge");
        expect(rows).toHaveLength(6);
    });
});
