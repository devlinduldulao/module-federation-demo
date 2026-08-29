import { describe, it, expect } from "@rstest/core";
import { render, screen } from "@testing-library/react";
import PrescriptionsSkeleton from "./PrescriptionsSkeleton";

describe("PrescriptionsSkeleton", () => {
    it("renders with role status for screen readers", () => {
        render(<PrescriptionsSkeleton />);
        expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("renders the sr-only streaming text including the port", () => {
        render(<PrescriptionsSkeleton />);
        expect(screen.getByText("STREAMING PRESCRIPTIONS :3002")).toBeInTheDocument();
    });

    it("has animate-pulse on the root element", () => {
        const { container } = render(<PrescriptionsSkeleton />);
        expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    it("renders 3 prescription row skeletons", () => {
        const { container } = render(<PrescriptionsSkeleton />);
        const rows = container.querySelectorAll(".py-3\\.5.border-b.border-border");
        expect(rows).toHaveLength(3);
    });

    it("renders the summary sidebar skeleton", () => {
        const { container } = render(<PrescriptionsSkeleton />);
        const sidebar = container.querySelector(".lg\\:w-72");
        expect(sidebar).toBeInTheDocument();
    });
});

