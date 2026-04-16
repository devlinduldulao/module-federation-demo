import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { Suspense } from "react";
import StreamingPrescriptionOrders, {
    __resetPrescriptionsStreamingResourceCache,
} from "./StreamingPrescriptionOrders";

vi.mock("./index.css", () => ({}));
vi.mock("./lib/utils", () => ({
    cn: (...args: unknown[]) =>
        args
            .flat()
            .filter((a) => typeof a === "string" && a.length > 0)
            .join(" "),
}));

function Fallback() {
    return <div role="status">Prescriptions loading skeleton</div>;
}

describe("StreamingPrescriptionOrders", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        __resetPrescriptionsStreamingResourceCache();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("shows the Suspense fallback while the resource is pending", () => {
        render(
            <Suspense fallback={<Fallback />}>
                <StreamingPrescriptionOrders />
            </Suspense>
        );
        expect(screen.getByRole("status")).toBeInTheDocument();
        expect(screen.getByText("Prescriptions loading skeleton")).toBeInTheDocument();
    });

    it("does not render PrescriptionOrders content while pending", () => {
        render(
            <Suspense fallback={<Fallback />}>
                <StreamingPrescriptionOrders />
            </Suspense>
        );
        expect(screen.queryByText("Active Orders")).not.toBeInTheDocument();
    });

    it("renders PrescriptionOrders after the delay resolves", async () => {
        render(
            <Suspense fallback={<Fallback />}>
                <StreamingPrescriptionOrders />
            </Suspense>
        );

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(screen.getByText("Prescriptions")).toBeInTheDocument();
        expect(screen.getByText("Active Orders")).toBeInTheDocument();
    });

    it("replaces the skeleton with PrescriptionOrders content after resolution", async () => {
        render(
            <Suspense fallback={<Fallback />}>
                <StreamingPrescriptionOrders />
            </Suspense>
        );

        expect(screen.getByText("Prescriptions loading skeleton")).toBeInTheDocument();

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(screen.queryByText("Prescriptions loading skeleton")).not.toBeInTheDocument();
        expect(screen.getByText("Prescriptions")).toBeInTheDocument();
    });

    it("reuses cached resource — a second render suspends with the existing pending resource", () => {
        const { unmount } = render(
            <Suspense fallback={<Fallback />}>
                <StreamingPrescriptionOrders />
            </Suspense>
        );
        unmount();

        render(
            <Suspense fallback={<div>Second skeleton</div>}>
                <StreamingPrescriptionOrders />
            </Suspense>
        );
        expect(screen.getByText("Second skeleton")).toBeInTheDocument();
    });
});
