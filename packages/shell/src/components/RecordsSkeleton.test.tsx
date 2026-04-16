import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RecordsSkeleton from "./RecordsSkeleton";

describe("RecordsSkeleton", () => {
    it("renders with role status for screen readers", () => {
        render(<RecordsSkeleton />);
        expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("renders the sr-only loading text including the port", () => {
        render(<RecordsSkeleton />);
        expect(screen.getByText("LOADING RECORDS :3001")).toBeInTheDocument();
    });

    it("renders 8 skeleton record cards", () => {
        const { container } = render(<RecordsSkeleton />);
        // Each record card has border + p-6 classes
        const cards = container.querySelectorAll(".border.border-edge.p-6");
        expect(cards).toHaveLength(8);
    });

    it("has animate-pulse on the root element", () => {
        const { container } = render(<RecordsSkeleton />);
        expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    it("renders 4 filter button skeletons", () => {
        const { container } = render(<RecordsSkeleton />);
        const filterSkeletons = container.querySelectorAll(".h-9.w-24.bg-elevated");
        expect(filterSkeletons).toHaveLength(4);
    });
});
