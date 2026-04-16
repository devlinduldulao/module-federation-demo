import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { Suspense } from "react";
import StreamingClinicalAnalytics, {
    __resetAnalyticsStreamingResourceCache,
} from "./StreamingClinicalAnalytics";

vi.mock("./index.css", () => ({}));
vi.mock("./lib/utils", () => ({
    cn: (...args: unknown[]) =>
        args
            .flat()
            .filter((a) => typeof a === "string" && a.length > 0)
            .join(" "),
}));

function Fallback() {
    return <div role="status">Analytics loading skeleton</div>;
}

describe("StreamingClinicalAnalytics", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        __resetAnalyticsStreamingResourceCache();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("shows the Suspense fallback while the resource is pending", () => {
        render(
            <Suspense fallback={<Fallback />}>
                <StreamingClinicalAnalytics />
            </Suspense>
        );
        expect(screen.getByRole("status")).toBeInTheDocument();
        expect(screen.getByText("Analytics loading skeleton")).toBeInTheDocument();
    });

    it("does not render ClinicalAnalytics content while pending", () => {
        render(
            <Suspense fallback={<Fallback />}>
                <StreamingClinicalAnalytics />
            </Suspense>
        );
        expect(screen.queryByText("Clinical Overview")).not.toBeInTheDocument();
    });

    it("renders ClinicalAnalytics after the delay resolves", async () => {
        render(
            <Suspense fallback={<Fallback />}>
                <StreamingClinicalAnalytics />
            </Suspense>
        );

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(screen.getByText("Analytics")).toBeInTheDocument();
        expect(screen.getByText("Clinical Overview")).toBeInTheDocument();
    });

    it("replaces the skeleton with ClinicalAnalytics content after resolution", async () => {
        render(
            <Suspense fallback={<Fallback />}>
                <StreamingClinicalAnalytics />
            </Suspense>
        );

        expect(screen.getByText("Analytics loading skeleton")).toBeInTheDocument();

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(screen.queryByText("Analytics loading skeleton")).not.toBeInTheDocument();
        expect(screen.getByText("Analytics")).toBeInTheDocument();
    });

    it("reuses cached resource — a second render suspends with the existing pending resource", () => {
        const { unmount } = render(
            <Suspense fallback={<Fallback />}>
                <StreamingClinicalAnalytics />
            </Suspense>
        );
        unmount();

        render(
            <Suspense fallback={<div>Second skeleton</div>}>
                <StreamingClinicalAnalytics />
            </Suspense>
        );
        expect(screen.getByText("Second skeleton")).toBeInTheDocument();
    });
});
