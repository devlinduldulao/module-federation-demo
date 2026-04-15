import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MedicalRecords from "./MedicalRecords";

vi.mock("./index.css", () => ({}));
vi.mock("./lib/utils", () => ({
    cn: (...args: unknown[]) =>
        args
            .flat()
            .filter((a) => typeof a === "string" && a.length > 0)
            .join(" "),
}));

describe("MedicalRecords", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("renders the header", () => {
        render(<MedicalRecords />);
        expect(screen.getByText("Records")).toBeInTheDocument();
        expect(screen.getByText("Patient Files")).toBeInTheDocument();
    });

    it("renders all 8 mock records by default", () => {
        render(<MedicalRecords />);
        expect(screen.getByText("Sarah Chen")).toBeInTheDocument();
        expect(screen.getByText("James Rodriguez")).toBeInTheDocument();
        expect(screen.getByText("Emily Watson")).toBeInTheDocument();
        expect(screen.getByText("Michael Torres")).toBeInTheDocument();
        expect(screen.getByText("Anna Kowalski")).toBeInTheDocument();
        expect(screen.getByText("David Park")).toBeInTheDocument();
        expect(screen.getByText("Lisa Nguyen")).toBeInTheDocument();
        expect(screen.getByText("Robert Fischer")).toBeInTheDocument();
    });

    it("shows record count", () => {
        render(<MedicalRecords />);
        expect(screen.getByText("8 records")).toBeInTheDocument();
    });

    it("renders all category filter buttons", () => {
        render(<MedicalRecords />);
        expect(screen.getByRole("button", { name: /all/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /lab results/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /imaging/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /consultation/i })).toBeInTheDocument();
    });

    it("filters to lab results (3 records)", async () => {
        const user = userEvent.setup();
        render(<MedicalRecords />);

        await user.click(screen.getByRole("button", { name: /lab results/i }));

        expect(screen.getByText("Sarah Chen")).toBeInTheDocument();
        expect(screen.getByText("Michael Torres")).toBeInTheDocument();
        expect(screen.getByText("Lisa Nguyen")).toBeInTheDocument();
        expect(screen.queryByText("James Rodriguez")).not.toBeInTheDocument();
        expect(screen.queryByText("Emily Watson")).not.toBeInTheDocument();
        expect(screen.getByText("3 records")).toBeInTheDocument();
    });

    it("filters to imaging (3 records)", async () => {
        const user = userEvent.setup();
        render(<MedicalRecords />);

        await user.click(screen.getByRole("button", { name: /imaging/i }));

        expect(screen.getByText("James Rodriguez")).toBeInTheDocument();
        expect(screen.getByText("Anna Kowalski")).toBeInTheDocument();
        expect(screen.getByText("Robert Fischer")).toBeInTheDocument();
        expect(screen.queryByText("Sarah Chen")).not.toBeInTheDocument();
        expect(screen.getByText("3 records")).toBeInTheDocument();
    });

    it("filters to consultation (2 records)", async () => {
        const user = userEvent.setup();
        render(<MedicalRecords />);

        await user.click(screen.getByRole("button", { name: /consultation/i }));

        expect(screen.getByText("Emily Watson")).toBeInTheDocument();
        expect(screen.getByText("David Park")).toBeInTheDocument();
        expect(screen.queryByText("Sarah Chen")).not.toBeInTheDocument();
        expect(screen.getByText("2 records")).toBeInTheDocument();
    });

    it("returns to all records when 'all' is clicked", async () => {
        const user = userEvent.setup();
        render(<MedicalRecords />);

        await user.click(screen.getByRole("button", { name: /lab results/i }));
        expect(screen.getByText("3 records")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /all/i }));
        expect(screen.getByText("8 records")).toBeInTheDocument();
    });

    it("dispatches addPrescription and showNotification events on Prescribe click", async () => {
        const user = userEvent.setup();
        const addPrescriptionHandler = vi.fn();
        const notificationHandler = vi.fn();

        window.addEventListener("addPrescription", addPrescriptionHandler);
        window.addEventListener("showNotification", notificationHandler);

        render(<MedicalRecords />);

        await user.click(screen.getByRole("button", { name: /create prescription for Sarah Chen/i }));

        expect(addPrescriptionHandler).toHaveBeenCalledTimes(1);
        const prescriptionEvent = addPrescriptionHandler.mock.calls[0]![0] as CustomEvent;
        expect(prescriptionEvent.detail).toEqual({
            id: 1,
            patientName: "Sarah Chen",
            provider: "Dr. Williams",
            quantity: 1,
        });

        expect(notificationHandler).toHaveBeenCalledTimes(1);
        const notifEvent = notificationHandler.mock.calls[0]![0] as CustomEvent;
        expect(notifEvent.detail).toEqual({
            type: "success",
            message: "Prescription created for Sarah Chen",
        });

        window.removeEventListener("addPrescription", addPrescriptionHandler);
        window.removeEventListener("showNotification", notificationHandler);
    });

    it("displays provider names and dates", () => {
        render(<MedicalRecords />);
        expect(screen.getAllByText("Dr. Williams").length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("2026-04-12")).toBeInTheDocument();
    });

    it("has proper accessibility roles", () => {
        render(<MedicalRecords />);
        expect(screen.getByRole("main")).toBeInTheDocument();
        expect(screen.getByRole("navigation", { name: /record category filters/i })).toBeInTheDocument();
        expect(screen.getByLabelText("Records grid")).toBeInTheDocument();
    });
});
