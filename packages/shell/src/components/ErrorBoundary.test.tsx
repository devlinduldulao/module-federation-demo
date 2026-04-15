import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorBoundary from "./ErrorBoundary";

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
    if (shouldThrow) {
        throw new Error("Test explosion");
    }
    return <div>Child content</div>;
}

describe("ErrorBoundary", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders children when there is no error", () => {
        render(
            <ErrorBoundary>
                <ThrowingChild shouldThrow={false} />
            </ErrorBoundary>
        );
        expect(screen.getByText("Child content")).toBeInTheDocument();
    });

    it("renders default fallback when a child throws", () => {
        vi.spyOn(console, "error").mockImplementation(() => { });

        render(
            <ErrorBoundary>
                <ThrowingChild shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
        expect(
            screen.getByText(/there was an error loading this module/i)
        ).toBeInTheDocument();
        expect(screen.queryByText("Child content")).not.toBeInTheDocument();

        vi.restoreAllMocks();
    });

    it("renders custom fallback when provided", () => {
        vi.spyOn(console, "error").mockImplementation(() => { });

        render(
            <ErrorBoundary fallback={<div>Custom fallback UI</div>}>
                <ThrowingChild shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText("Custom fallback UI")).toBeInTheDocument();
        expect(
            screen.queryByText("Something went wrong")
        ).not.toBeInTheDocument();

        vi.restoreAllMocks();
    });

    it("resets error state when Retry is clicked", async () => {
        const user = userEvent.setup();
        vi.spyOn(console, "error").mockImplementation(() => { });

        let shouldThrow = true;
        function ToggleChild() {
            if (shouldThrow) throw new Error("boom");
            return <div>Recovered content</div>;
        }

        const { rerender } = render(
            <ErrorBoundary>
                <ToggleChild />
            </ErrorBoundary>
        );

        expect(screen.getByText("Something went wrong")).toBeInTheDocument();

        shouldThrow = false;
        await user.click(screen.getByRole("button", { name: /retry/i }));

        rerender(
            <ErrorBoundary>
                <ToggleChild />
            </ErrorBoundary>
        );

        expect(screen.getByText("Recovered content")).toBeInTheDocument();

        vi.restoreAllMocks();
    });

    it("shows the ERROR label", () => {
        vi.spyOn(console, "error").mockImplementation(() => { });

        render(
            <ErrorBoundary>
                <ThrowingChild shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText("ERROR")).toBeInTheDocument();

        vi.restoreAllMocks();
    });

    it("calls console.error with the error", () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => { });

        render(
            <ErrorBoundary>
                <ThrowingChild shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(errorSpy).toHaveBeenCalledWith(
            "Module Federation Error:",
            expect.any(Error),
            expect.objectContaining({ componentStack: expect.any(String) })
        );

        vi.restoreAllMocks();
    });
});
