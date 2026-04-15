import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./Home";

vi.mock("./index.css", () => ({}));

vi.mock("./lib/theme", () => ({
    useActiveTheme: () => ({ theme: "dark", label: "Dark" }),
}));

vi.mock("./lib/utils", () => ({
    cn: (...args: unknown[]) =>
        args
            .flat()
            .filter((v) => typeof v === "string" && v.length > 0)
            .join(" "),
}));

describe("Home", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders the hero heading and subtitle", () => {
        render(<Home />);
        expect(screen.getByText("Welcome Home")).toBeInTheDocument();
        expect(screen.getByText("Micro-Frontend Architecture")).toBeInTheDocument();
    });

    it("renders all three destination cards", () => {
        render(<Home />);
        expect(screen.getByText("Records")).toBeInTheDocument();
        expect(screen.getByText("Prescriptions")).toBeInTheDocument();
        expect(screen.getByText("Analytics")).toBeInTheDocument();
    });

    it("shows port numbers for each destination", () => {
        render(<Home />);
        expect(screen.getByText(":3001")).toBeInTheDocument();
        expect(screen.getByText(":3002")).toBeInTheDocument();
        expect(screen.getByText(":3003")).toBeInTheDocument();
    });

    it("shows destination descriptions", () => {
        render(<Home />);
        expect(
            screen.getByText(/access patient medical records/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText(/manage active prescription orders/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText(/monitor real-time clinical metrics/i)
        ).toBeInTheDocument();
    });

    it("renders architecture highlights", () => {
        render(<Home />);
        expect(screen.getByText("Module Federation")).toBeInTheDocument();
        expect(screen.getByText("React 19")).toBeInTheDocument();
        expect(screen.getByText("Rspack")).toBeInTheDocument();
        expect(screen.getByText("4 Remotes")).toBeInTheDocument();
    });

    it("shows the module count", () => {
        render(<Home />);
        expect(screen.getByText("3 modules available")).toBeInTheDocument();
    });

    it("renders the How It Works footer", () => {
        render(<Home />);
        expect(screen.getByText("How It Works")).toBeInTheDocument();
        expect(screen.getByText("Independent Builds")).toBeInTheDocument();
        expect(screen.getByText("Fault Isolation")).toBeInTheDocument();
    });

    it("shows the theme label badge", () => {
        render(<Home />);
        expect(screen.getByText("Dark")).toBeInTheDocument();
    });

    it("dispatches navigateToModule when a destination card is clicked", async () => {
        const user = userEvent.setup();
        const handler = vi.fn();
        window.addEventListener("navigateToModule", handler);

        render(<Home />);
        await user.click(
            screen.getByRole("button", { name: /go to records module/i })
        );

        expect(handler).toHaveBeenCalledTimes(1);
        expect((handler.mock.calls[0][0] as CustomEvent).detail).toEqual({
            module: "records",
        });

        window.removeEventListener("navigateToModule", handler);
    });

    it("dispatches showNotification when a destination card is clicked", async () => {
        const user = userEvent.setup();
        const handler = vi.fn();
        window.addEventListener("showNotification", handler);

        render(<Home />);
        await user.click(
            screen.getByRole("button", { name: /go to prescriptions module/i })
        );

        expect(handler).toHaveBeenCalledTimes(1);
        expect((handler.mock.calls[0][0] as CustomEvent).detail).toEqual({
            type: "info",
            message: "Navigating to Prescriptions",
        });

        window.removeEventListener("showNotification", handler);
    });

    it("dispatches the correct module id for each destination", async () => {
        const user = userEvent.setup();
        const handler = vi.fn();
        window.addEventListener("navigateToModule", handler);

        render(<Home />);
        await user.click(
            screen.getByRole("button", { name: /go to analytics module/i })
        );

        expect((handler.mock.calls[0][0] as CustomEvent).detail).toEqual({
            module: "analytics",
        });

        window.removeEventListener("navigateToModule", handler);
    });

    it("has a main landmark role", () => {
        render(<Home />);
        expect(screen.getByRole("main")).toBeInTheDocument();
    });

    it("has labeled sections for architecture and modules", () => {
        render(<Home />);
        expect(
            screen.getByRole("region", { name: /architecture overview/i })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("region", { name: /available modules/i })
        ).toBeInTheDocument();
    });
});
