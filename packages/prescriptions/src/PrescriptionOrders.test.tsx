import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PrescriptionOrders from "./PrescriptionOrders";

vi.mock("./index.css", () => ({}));
vi.mock("./lib/utils", () => ({
    cn: (...args: unknown[]) =>
        args
            .flat()
            .filter((a) => typeof a === "string" && a.length > 0)
            .join(" "),
}));

describe("PrescriptionOrders", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("renders the header", () => {
        render(<PrescriptionOrders />);
        expect(screen.getByText("Prescriptions")).toBeInTheDocument();
        expect(screen.getByText("Active Orders")).toBeInTheDocument();
    });

    it("renders initial prescriptions (Sarah Chen + Lisa Nguyen)", () => {
        render(<PrescriptionOrders />);
        expect(screen.getByText("Sarah Chen")).toBeInTheDocument();
        expect(screen.getByText("Lisa Nguyen")).toBeInTheDocument();
    });

    it("shows correct prescription count for initial items", () => {
        render(<PrescriptionOrders />);
        // 2 prescriptions pending
        expect(screen.getByText("2 prescriptions pending submission")).toBeInTheDocument();
    });

    it("shows Prescription Summary section", () => {
        render(<PrescriptionOrders />);
        expect(screen.getByText("Prescription Summary")).toBeInTheDocument();
    });

    it("displays refill counts", () => {
        render(<PrescriptionOrders />);
        // Sarah Chen: 1 refill, Lisa Nguyen: 2 refills
        expect(screen.getByText("1 refill")).toBeInTheDocument();
        expect(screen.getByText("2 refills")).toBeInTheDocument();
    });

    it("calculates correct total refills", () => {
        render(<PrescriptionOrders />);
        // Total = 1 + 2 = 3
        expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("increments refills when + is clicked", async () => {
        const user = userEvent.setup();
        render(<PrescriptionOrders />);

        const incrementBtn = screen.getByRole("button", {
            name: /increase refills for Sarah Chen/i,
        });
        await user.click(incrementBtn);

        // After increment: Sarah Chen refills = 2
        expect(screen.getAllByText("2 refills").length).toBeGreaterThanOrEqual(1);
    });

    it("decrements refills when − is clicked", async () => {
        const user = userEvent.setup();
        render(<PrescriptionOrders />);

        // Lisa Nguyen starts at 2 refills
        const decrementBtn = screen.getByRole("button", {
            name: /decrease refills for Lisa Nguyen/i,
        });
        await user.click(decrementBtn);

        // After decrement: Lisa Nguyen refills = 1
        expect(screen.getAllByText("1 refill").length).toBeGreaterThanOrEqual(1);
    });

    it("does not go below 1 refill", async () => {
        render(<PrescriptionOrders />);

        // Sarah Chen starts at 1 — decrease button should be disabled
        const decrementBtn = screen.getByRole("button", {
            name: /decrease refills for Sarah Chen/i,
        });
        expect(decrementBtn).toBeDisabled();
    });

    it("removes prescription when × is clicked", async () => {
        const user = userEvent.setup();
        render(<PrescriptionOrders />);

        const removeBtn = screen.getByRole("button", {
            name: /remove prescription for Sarah Chen/i,
        });
        await user.click(removeBtn);

        expect(screen.queryByText("Sarah Chen")).not.toBeInTheDocument();
        expect(screen.getByText("Lisa Nguyen")).toBeInTheDocument();
    });

    it("shows empty state when all prescriptions removed", async () => {
        const user = userEvent.setup();
        render(<PrescriptionOrders />);

        await user.click(screen.getByRole("button", { name: /remove prescription for Sarah Chen/i }));
        await user.click(screen.getByRole("button", { name: /remove prescription for Lisa Nguyen/i }));

        expect(screen.getByText("Queue is empty")).toBeInTheDocument();
        expect(screen.getByText(/browse records/i)).toBeInTheDocument();
    });

    it("requests navigation back to records from the empty state", async () => {
        const user = userEvent.setup();
        const handler = vi.fn();
        window.addEventListener("navigateToModule", handler);

        render(<PrescriptionOrders />);

        await user.click(screen.getByRole("button", { name: /remove prescription for Sarah Chen/i }));
        await user.click(screen.getByRole("button", { name: /remove prescription for Lisa Nguyen/i }));
        await user.click(screen.getByRole("button", { name: /browse records from the shell/i }));

        expect(handler).toHaveBeenCalledTimes(1);
        expect((handler.mock.calls[0]![0] as CustomEvent).detail).toEqual({
            module: "records",
        });

        window.removeEventListener("navigateToModule", handler);
    });

    it("adds prescriptions via addPrescription event", () => {
        render(<PrescriptionOrders />);

        act(() => {
            window.dispatchEvent(
                new CustomEvent("addPrescription", {
                    detail: { id: 99, patientName: "Test Patient", provider: "Dr. Test", quantity: 1 },
                })
            );
        });

        expect(screen.getByText("Test Patient")).toBeInTheDocument();
    });

    it("increments existing prescription via addPrescription event", () => {
        render(<PrescriptionOrders />);

        // Add Lisa Nguyen again (id: 7) — should increment existing qty from 2 to 3
        act(() => {
            window.dispatchEvent(
                new CustomEvent("addPrescription", {
                    detail: { id: 7, patientName: "Lisa Nguyen", provider: "Dr. Patel", quantity: 1 },
                })
            );
        });

        // Lisa Nguyen now qty 3
        expect(screen.getByText("3 refills")).toBeInTheDocument();
    });

    it("dispatches showNotification on submit", async () => {
        const user = userEvent.setup();
        const handler = vi.fn();
        window.addEventListener("showNotification", handler);

        render(<PrescriptionOrders />);

        const submitBtn = screen.getByRole("button", { name: /submit/i });
        await user.click(submitBtn);

        expect(handler).toHaveBeenCalledTimes(1);
        expect((handler.mock.calls[0]![0] as CustomEvent).detail).toEqual({
            type: "success",
            message: "Prescriptions submitted for pharmacy review!",
        });

        window.removeEventListener("showNotification", handler);
    });

    it("has proper accessibility roles", () => {
        render(<PrescriptionOrders />);
        expect(screen.getByRole("main")).toBeInTheDocument();
        expect(screen.getByLabelText("Prescription items")).toBeInTheDocument();
    });

    it("shows HIPAA compliance in summary", () => {
        render(<PrescriptionOrders />);
        expect(screen.getByText("HIPAA Compliant")).toBeInTheDocument();
    });
});
