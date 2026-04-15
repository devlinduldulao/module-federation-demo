import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ModuleFallback from "./ModuleFallback";

describe("ModuleFallback", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders the title and message", () => {
        render(
            <ModuleFallback
                title="Products Unavailable"
                message="The products service is down."
            />
        );
        expect(screen.getByText("Products Unavailable")).toBeInTheDocument();
        expect(
            screen.getByText("The products service is down.")
        ).toBeInTheDocument();
    });

    it("renders the OFF icon", () => {
        render(
            <ModuleFallback title="Down" message="Offline." />
        );
        expect(screen.getByText("OFF")).toBeInTheDocument();
    });

    it("renders a retry button when onRetry is provided", () => {
        render(
            <ModuleFallback
                title="Down"
                message="Offline."
                onRetry={() => { }}
            />
        );
        expect(
            screen.getByRole("button", { name: /retry loading module/i })
        ).toBeInTheDocument();
    });

    it("does not render a retry button when onRetry is omitted", () => {
        render(
            <ModuleFallback title="Down" message="Offline." />
        );
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("calls onRetry when the retry button is clicked", async () => {
        const user = userEvent.setup();
        const onRetry = vi.fn();

        render(
            <ModuleFallback
                title="Down"
                message="Offline."
                onRetry={onRetry}
            />
        );

        await user.click(
            screen.getByRole("button", { name: /retry loading module/i })
        );

        expect(onRetry).toHaveBeenCalledTimes(1);
    });
});
