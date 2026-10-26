import { describe, it, expect, rs, beforeEach, afterEach } from "@rstest/core";
import { render, screen, act } from "@testing-library/react";
import { Suspense, type ReactNode } from "react";
import StreamingHome, {
    __resetHomeStreamingResourceCache,
} from "./StreamingHome";

rs.mock("./index.css", () => ({}));
rs.mock("./lib/utils", () => ({
    cn: (...args: unknown[]) =>
        args
            .flat()
            .filter((a) => typeof a === "string" && a.length > 0)
            .join(" "),
}));
rs.mock("./lib/theme", () => ({
    useActiveTheme: () => ({ theme: "dark", label: "Dark" }),
}));

function Fallback() {
    return <div role="status">Home loading skeleton</div>;
}

// use() yields to the microtask queue once before React commits a fallback. A
// synchronous act() — which is what RTL's bare render() uses — drops that
// continuation, so a render that reaches a use() call must be awaited.
async function renderStreaming(fallback: ReactNode = <Fallback />) {
    let view!: ReturnType<typeof render>;
    await act(async () => {
        view = render(
            <Suspense fallback={fallback}>
                <StreamingHome />
            </Suspense>
        );
    });
    return view;
}

describe("StreamingHome", () => {
    beforeEach(() => {
        rs.useFakeTimers();
        __resetHomeStreamingResourceCache();
    });

    afterEach(() => {
        rs.useRealTimers();
    });

    it("shows the Suspense fallback while the promise is pending", async () => {
        await renderStreaming();
        expect(screen.getByRole("status")).toBeInTheDocument();
        expect(screen.getByText("Home loading skeleton")).toBeInTheDocument();
    });

    it("does not render Home content while pending", async () => {
        await renderStreaming();
        expect(screen.queryByText("Micro-Frontend Architecture")).not.toBeInTheDocument();
    });

    it("renders Home after the delay resolves", async () => {
        await renderStreaming();

        await act(async () => {
            await rs.runAllTimersAsync();
        });

        expect(screen.getByText("A Modular Federation Showcase")).toBeInTheDocument();
        expect(screen.getByText("Micro-Frontend Architecture")).toBeInTheDocument();
    });

    it("replaces the skeleton with Home content after resolution", async () => {
        await renderStreaming();

        expect(screen.getByText("Home loading skeleton")).toBeInTheDocument();

        await act(async () => {
            await rs.runAllTimersAsync();
        });

        expect(screen.queryByText("Home loading skeleton")).not.toBeInTheDocument();
        expect(screen.getByText("A Modular Federation Showcase")).toBeInTheDocument();
    });

    it("reuses the cached promise — a second render suspends on the existing pending delay", async () => {
        const { unmount } = await renderStreaming();
        unmount();

        await renderStreaming(<div>Second skeleton</div>);
        expect(screen.getByText("Second skeleton")).toBeInTheDocument();
    });
});