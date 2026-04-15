import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ClinicalAnalytics from "./ClinicalAnalytics";

vi.mock("./index.css", () => ({}));
vi.mock("./lib/utils", () => ({
    cn: (...args: unknown[]) =>
        args
            .flat()
            .filter((a) => typeof a === "string" && a.length > 0)
            .join(" "),
}));

describe("ClinicalAnalytics", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("renders the header", () => {
        render(<ClinicalAnalytics />);
        expect(screen.getByText("Analytics")).toBeInTheDocument();
        expect(screen.getByText("Clinical Overview")).toBeInTheDocument();
    });

    it("renders the welcome banner", () => {
        render(<ClinicalAnalytics />);
        expect(screen.getByText("Welcome back")).toBeInTheDocument();
        expect(screen.getByText("Dr. Thompson")).toBeInTheDocument();
    });

    it("displays all four stat cards", () => {
        render(<ClinicalAnalytics />);
        expect(screen.getByText("Active Patients")).toBeInTheDocument();
        expect(screen.getByText("Prescriptions Today")).toBeInTheDocument();
        expect(screen.getByText("Critical Alerts")).toBeInTheDocument();
        expect(screen.getByText("Avg Wait Time")).toBeInTheDocument();
    });

    it("shows stat values", () => {
        render(<ClinicalAnalytics />);
        expect(screen.getByText("247")).toBeInTheDocument();
        expect(screen.getByText("89")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
        expect(screen.getByText("14m")).toBeInTheDocument();
    });

    it("shows trend values", () => {
        render(<ClinicalAnalytics />);
        expect(screen.getByText(/\+12%/)).toBeInTheDocument();
        expect(screen.getByText(/\+8%/)).toBeInTheDocument();
        expect(screen.getByText(/-25%/)).toBeInTheDocument();
        expect(screen.getByText(/-18%/)).toBeInTheDocument();
    });

    it("renders the activity feed section", () => {
        render(<ClinicalAnalytics />);
        expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    });

    it("displays all 8 activity items", () => {
        render(<ClinicalAnalytics />);
        expect(screen.getByText(/Patient Sarah Chen admitted to Ward 3B/)).toBeInTheDocument();
        expect(screen.getByText(/Critical lab result flagged for Michael Torres/)).toBeInTheDocument();
        expect(screen.getByText(/Prescription filled for Lisa Nguyen/)).toBeInTheDocument();
        expect(screen.getByText(/Patient James Rodriguez discharged/)).toBeInTheDocument();
        expect(screen.getByText(/Lab results received for Anna Kowalski/)).toBeInTheDocument();
        expect(screen.getByText(/New admission: David Park/)).toBeInTheDocument();
        expect(screen.getByText(/Alert resolved: Emily Watson/)).toBeInTheDocument();
        expect(screen.getByText(/Prescription renewal approved for Robert Fischer/)).toBeInTheDocument();
    });

    it("shows timestamps for activities", () => {
        render(<ClinicalAnalytics />);
        expect(screen.getByText("2 min ago")).toBeInTheDocument();
        expect(screen.getByText("8 min ago")).toBeInTheDocument();
        expect(screen.getByText("15 min ago")).toBeInTheDocument();
    });

    it("shows shift info in welcome banner", () => {
        render(<ClinicalAnalytics />);
        expect(screen.getByText("Shift: Day")).toBeInTheDocument();
        expect(screen.getByText("Ward: General")).toBeInTheDocument();
        expect(screen.getByText("On Duty")).toBeInTheDocument();
    });

    it("has proper accessibility roles", () => {
        render(<ClinicalAnalytics />);
        expect(screen.getByRole("main")).toBeInTheDocument();
        expect(screen.getByLabelText("Clinical statistics")).toBeInTheDocument();
        expect(screen.getByLabelText("Clinical activity")).toBeInTheDocument();
    });
});
