import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomeSkeleton from "./HomeSkeleton";

describe("HomeSkeleton", () => {
    it("renders with role status for screen readers", () => {
        render(<HomeSkeleton />);
        expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("renders the sr-only loading text", () => {
        render(<HomeSkeleton />);
        expect(screen.getByText("Loading home...")).toBeInTheDocument();
    });

    it("renders the visible loading port label", () => {
        render(<HomeSkeleton />);
        expect(screen.getByText("LOADING HOME :3004")).toBeInTheDocument();
    });

    it("has animate-pulse on the root element", () => {
        const { container } = render(<HomeSkeleton />);
        expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    it("renders 3 destination card skeletons", () => {
        const { container } = render(<HomeSkeleton />);
        // Destination cards grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
        const cardsGrid = container.querySelector(
            ".grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3"
        );
        expect(cardsGrid).toBeInTheDocument();
        expect(cardsGrid!.children).toHaveLength(3);
    });

    it("renders 4 architecture stat skeletons", () => {
        const { container } = render(<HomeSkeleton />);
        // Stats grid: grid-cols-2 lg:grid-cols-4
        const statsGrid = container.querySelector(".grid.grid-cols-2.lg\\:grid-cols-4");
        expect(statsGrid).toBeInTheDocument();
        expect(statsGrid!.children).toHaveLength(4);
    });

    it("renders 3 animated loading dots", () => {
        const { container } = render(<HomeSkeleton />);
        const dotsContainer = container.querySelector(".flex.gap-1\\.5");
        expect(dotsContainer).toBeInTheDocument();
        expect(dotsContainer!.children).toHaveLength(3);
    });
});
