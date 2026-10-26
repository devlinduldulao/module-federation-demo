import { describe, it, expect, rs, beforeEach, afterEach } from "@rstest/core";
import { render, screen, act } from "@testing-library/react";
import { Suspense, type ReactNode } from "react";
import StreamingClinicalAnalytics, {
    __resetAnalyticsStreamingResourceCache,
} from "./StreamingClinicalAnalytics";

rs.mock("./index.css", () => ({}));
rs.mock("./lib/utils", () => ({
    cn: (...args: unknown[]) =>
        args
            .flat()
            .filter((a) => typeof a === "string" && a.length > 0)
            .join(" "),
}));

function Fallback() {
    return <div role="status">Analytics loading skeleton</div>;
}

// use() yields to the microtask queue once before React commits a fallback. A
// synchronous act() — which is what RTL's bare render() uses — drops that
// continuation, so a render that reaches a use() call must be awaited.
async function renderStreaming(fallback: ReactNode = <Fallback />) {
    let view!: ReturnType<typeof render>;
    await act(async () => {
        view = render(
            <Suspense fallback={fallback}>
                <StreamingClinicalAnalytics />
            </Suspense>
        );
    });
    return view;
}

describe("StreamingClinicalAnalytics", () => {
    beforeEach(() => {
        rs.useFakeTimers();
        __resetAnalyticsStreamingResourceCache();
    });

    afterEach(() => {
        rs.useRealTimers();
    });

    it("shows the Suspense fallback while the promise is pending", async () => {
        await renderStreaming();
        expect(screen.getByRole("status")).toBeInTheDocument();
        expect(screen.getByText("Analytics loading skeleton")).toBeInTheDocument();
    });

    it("does not render ClinicalAnalytics content while pending", async () => {
        await renderStreaming();
        expect(screen.queryByText("Clinical Overview")).not.toBeInTheDocument();
    });

    it("renders ClinicalAnalytics after the delay resolves", async () => {
        await renderStreaming();

        await act(async () => {
            await rs.runAllTimersAsync();
        });

        expect(screen.getByText("Analytics")).toBeInTheDocument();
        expect(screen.getByText("Clinical Overview")).toBeInTheDocument();
    });

    it("replaces the skeleton with ClinicalAnalytics content after resolution", async () => {
        await renderStreaming();

        expect(screen.getByText("Analytics loading skeleton")).toBeInTheDocument();

        await act(async () => {
            await rs.runAllTimersAsync();
        });

        expect(screen.queryByText("Analytics loading skeleton")).not.toBeInTheDocument();
        expect(screen.getByText("Analytics")).toBeInTheDocument();
    });

    it("reuses the cached promise — a second render suspends on the existing pending delay", async () => {
        const { unmount } = await renderStreaming();
        unmount();

        await renderStreaming(<div>Second skeleton</div>);
        expect(screen.getByText("Second skeleton")).toBeInTheDocument();
    });
});