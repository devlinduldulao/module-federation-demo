import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LoadingSpinner from "./LoadingSpinner";

describe("LoadingSpinner", () => {
    it("renders with role status", () => {
        render(<LoadingSpinner />);
        expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("has aria-live polite", () => {
        render(<LoadingSpinner />);
        expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    });

    it("renders the default label text", () => {
        render(<LoadingSpinner />);
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders a custom label", () => {
        render(<LoadingSpinner label="Fetching records" />);
        expect(screen.getByText("Fetching records")).toBeInTheDocument();
    });

    it("sets aria-label on the label element matching the label prop", () => {
        render(<LoadingSpinner label="Streaming analytics" />);
        expect(screen.getByLabelText("Streaming analytics")).toBeInTheDocument();
    });

    it("renders three animated dots", () => {
        const { container } = render(<LoadingSpinner />);
        const hiddenDotContainer = container.querySelector('[aria-hidden="true"]');
        expect(hiddenDotContainer).toBeInTheDocument();
        expect(hiddenDotContainer!.children).toHaveLength(3);
    });

    it("applies sm dot size class", () => {
        const { container } = render(<LoadingSpinner size="sm" />);
        const hiddenDotContainer = container.querySelector('[aria-hidden="true"]');
        const firstDot = hiddenDotContainer!.children[0]!;
        expect(firstDot.className).toContain("w-1 h-1");
    });

    it("applies md dot size class by default", () => {
        const { container } = render(<LoadingSpinner />);
        const hiddenDotContainer = container.querySelector('[aria-hidden="true"]');
        const firstDot = hiddenDotContainer!.children[0]!;
        expect(firstDot.className).toContain("w-1.5 h-1.5");
    });

    it("applies lg dot size class", () => {
        const { container } = render(<LoadingSpinner size="lg" />);
        const hiddenDotContainer = container.querySelector('[aria-hidden="true"]');
        const firstDot = hiddenDotContainer!.children[0]!;
        expect(firstDot.className).toContain("w-2 h-2");
    });

    it("applies staggered animation delays on the three dots", () => {
        const { container } = render(<LoadingSpinner />);
        const hiddenDotContainer = container.querySelector('[aria-hidden="true"]');
        const dots = Array.from(hiddenDotContainer!.children) as HTMLElement[];
        expect(dots[0]!.style.animation).toContain("0s");
        expect(dots[1]!.style.animation).toContain("0.2s");
        expect(dots[2]!.style.animation).toContain("0.4s");
    });
});
