import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { Suspense } from "react";
import StreamingHome, {
    __resetHomeStreamingResourceCache,
} from "./StreamingHome";

vi.mock("./index.css", () => ({}));
vi.mock("./lib/utils", () => ({
    cn: (...args: unknown[]) =>
        args
            .flat()
            .filter((a) => typeof a === "string" && a.length > 0)
            .join(" "),
}));
vi.mock("./lib/theme", () => ({
    useActiveTheme: () => ({ theme: "dark", label: "Dark" }),
}));

function Fallback() {
    return <div role="status">Home loading skeleton</div>;
}

describe("StreamingHome", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        __resetHomeStreamingResourceCache();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("shows the Suspense fallback while the resource is pending", () => {
        render(
            <Suspense fallback={<Fallback />}>
                <StreamingHome />
            </Suspense>
        );
        expect(screen.getByRole("status")).toBeInTheDocument();
        expect(screen.getByText("Home loading skeleton")).toBeInTheDocument();
    });

    it("does not render Home content while pending", () => {
        render(
            <Suspense fallback={<Fallback />}>
                <StreamingHome />
            </Suspense>
        );
        expect(screen.queryByText("Welcome Home")).not.toBeInTheDocument();
    });

    it("renders Home after the delay resolves", async () => {
        render(
            <Suspense fallback={<Fallback />}>
                <StreamingHome />
            </Suspense>
        );

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(screen.getByText("Welcome Home")).toBeInTheDocument();
        expect(screen.getByText("Micro-Frontend Architecture")).toBeInTheDocument();
    });

    it("replaces the skeleton with Home content after resolution", async () => {
        render(
            <Suspense fallback={<Fallback />}>
                <StreamingHome />
            </Suspense>
        );

        expect(screen.getByText("Home loading skeleton")).toBeInTheDocument();

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(screen.queryByText("Home loading skeleton")).not.toBeInTheDocument();
        expect(screen.getByText("Welcome Home")).toBeInTheDocument();
    });

    it("reuses cached resource — a second render suspends with the existing pending resource", () => {
        const { unmount } = render(
            <Suspense fallback={<Fallback />}>
                <StreamingHome />
            </Suspense>
        );
        unmount();

        render(
            <Suspense fallback={<div>Second skeleton</div>}>
                <StreamingHome />
            </Suspense>
        );
        expect(screen.getByText("Second skeleton")).toBeInTheDocument();
    });
});
