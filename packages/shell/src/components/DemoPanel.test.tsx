import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DemoPanel from "./DemoPanel";
import type { RemoteHealth } from "../lib/health";
import type { RemoteVersionInfo, KilledRemotes } from "../lib/demo";

const HEALTH: RemoteHealth[] = [
    { id: "home", port: "3004", status: "online", latencyMs: 12, lastChecked: Date.now() },
    { id: "records", port: "3001", status: "online", latencyMs: 8, lastChecked: Date.now() },
    { id: "prescriptions", port: "3002", status: "offline", latencyMs: null, lastChecked: null },
    { id: "analytics", port: "3003", status: "checking", latencyMs: null, lastChecked: null },
];

const KILLED: KilledRemotes = {
    home: false,
    records: false,
    prescriptions: false,
    analytics: false,
};

const VERSIONS: RemoteVersionInfo[] = [
    { id: "home", version: "1.0.0", variant: "stable", buildHash: "a3f2c1d" },
    { id: "records", version: "2.1.0", variant: "stable", buildHash: "b7e4f9a" },
    { id: "prescriptions", version: "1.3.2", variant: "stable", buildHash: "c1d8e3b" },
    { id: "analytics", version: "1.5.0", variant: "stable", buildHash: "d9f2a7c" },
];

const defaults = {
    isOpen: true,
    onClose: vi.fn(),
    health: HEALTH,
    killed: KILLED,
    onToggleKill: vi.fn(),
    onKillAll: vi.fn(),
    onRestoreAll: vi.fn(),
    versions: VERSIONS,
    variant: "stable" as const,
    onToggleVariant: vi.fn(),
};

describe("DemoPanel", () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it("returns null when isOpen is false", () => {
        const { container } = render(<DemoPanel {...defaults} isOpen={false} />);
        expect(container.innerHTML).toBe("");
    });

    it("renders the Federation Lab heading when open", () => {
        render(<DemoPanel {...defaults} />);
        expect(screen.getByRole("heading", { name: "Federation Lab" })).toBeInTheDocument();
        expect(screen.getByText("Live Demo Controls")).toBeInTheDocument();
    });

    it("renders the dialog with correct role", () => {
        render(<DemoPanel {...defaults} />);
        expect(
            screen.getByRole("dialog", { name: /demo controls/i })
        ).toBeInTheDocument();
    });

    it("calls onClose when the close button is clicked", async () => {
        const user = userEvent.setup();
        render(<DemoPanel {...defaults} />);

        const closeButtons = screen.getAllByLabelText(/close demo panel/i);
        await user.click(closeButtons[1]!); // the × button inside the panel

        expect(defaults.onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when the backdrop is clicked", async () => {
        const user = userEvent.setup();
        render(<DemoPanel {...defaults} />);

        const closeButtons = screen.getAllByLabelText(/close demo panel/i);
        await user.click(closeButtons[0]!); // the backdrop button

        expect(defaults.onClose).toHaveBeenCalledTimes(1);
    });

    // Health monitor section
    it("renders health status for all remotes", () => {
        render(<DemoPanel {...defaults} />);
        expect(screen.getByText("Remote Health")).toBeInTheDocument();
        expect(screen.getAllByText("home").length).toBeGreaterThan(0);
        expect(screen.getAllByText("records").length).toBeGreaterThan(0);
        expect(screen.getAllByText("prescriptions").length).toBeGreaterThan(0);
        expect(screen.getAllByText("analytics").length).toBeGreaterThan(0);
    });

    it("shows latency for online remotes", () => {
        render(<DemoPanel {...defaults} />);
        expect(screen.getByText("12ms")).toBeInTheDocument();
        expect(screen.getByText("8ms")).toBeInTheDocument();
    });

    it("shows status labels correctly", () => {
        render(<DemoPanel {...defaults} />);
        expect(screen.getByText("Offline")).toBeInTheDocument();
        expect(screen.getByText("Checking")).toBeInTheDocument();
    });

    // Kill switch section
    it("renders kill switch buttons for each remote", () => {
        render(<DemoPanel {...defaults} />);
        expect(
            screen.getByRole("button", { name: /kill home module/i })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /kill records module/i })
        ).toBeInTheDocument();
    });

    it("calls onToggleKill when a kill button is clicked", async () => {
        const user = userEvent.setup();
        render(<DemoPanel {...defaults} />);

        await user.click(
            screen.getByRole("button", { name: /kill records module/i })
        );
        expect(defaults.onToggleKill).toHaveBeenCalledWith("records");
    });

    it("shows LIVE for non-killed modules and DOWN for killed", () => {
        const killedState = { ...KILLED, prescriptions: true };
        render(<DemoPanel {...defaults} killed={killedState} />);

        // Get all LIVE labels - should be 5 (2 from health Online + 3 from kill switches)
        const liveElements = screen.getAllByText("LIVE");
        expect(liveElements.length).toBeGreaterThan(0);
        // Prescriptions should show DOWN in kill switches
        expect(screen.getByText("DOWN")).toBeInTheDocument();
    });

    it("shows Killed status in health for killed modules", () => {
        const killedState = { ...KILLED, home: true };
        render(<DemoPanel {...defaults} killed={killedState} />);
        expect(screen.getByText("Killed")).toBeInTheDocument();
    });

    it("calls onKillAll when Kill All button is clicked", async () => {
        const user = userEvent.setup();
        render(<DemoPanel {...defaults} />);

        await user.click(
            screen.getByRole("button", { name: /kill all remote modules/i })
        );
        expect(defaults.onKillAll).toHaveBeenCalledTimes(1);
    });

    it("calls onRestoreAll when Restore All button is clicked", async () => {
        const user = userEvent.setup();
        const killedState = { home: true, records: true, prescriptions: true, analytics: true };
        render(<DemoPanel {...defaults} killed={killedState} />);

        await user.click(
            screen.getByRole("button", { name: /restore all remote modules/i })
        );
        expect(defaults.onRestoreAll).toHaveBeenCalledTimes(1);
    });

    it("disables Kill All when all are already killed", () => {
        const killedState = { home: true, records: true, prescriptions: true, analytics: true };
        render(<DemoPanel {...defaults} killed={killedState} />);

        expect(
            screen.getByRole("button", { name: /kill all remote modules/i })
        ).toBeDisabled();
    });

    it("disables Restore All when none are killed", () => {
        render(<DemoPanel {...defaults} />);
        expect(
            screen.getByRole("button", { name: /restore all remote modules/i })
        ).toBeDisabled();
    });

    // Version registry section
    it("renders version info for all remotes", () => {
        render(<DemoPanel {...defaults} />);
        expect(screen.getByText("v1.0.0")).toBeInTheDocument();
        expect(screen.getByText("v2.1.0")).toBeInTheDocument();
        expect(screen.getByText("#a3f2c1d")).toBeInTheDocument();
    });

    it("shows Stable Ring label when stable variant", () => {
        render(<DemoPanel {...defaults} />);
        expect(screen.getByText("Stable Ring")).toBeInTheDocument();
    });

    it("calls onToggleVariant when the A/B button is clicked", async () => {
        const user = userEvent.setup();
        render(<DemoPanel {...defaults} />);

        await user.click(
            screen.getByRole("button", { name: /switch to canary deployment/i })
        );
        expect(defaults.onToggleVariant).toHaveBeenCalledTimes(1);
    });

    it("shows Canary Ring when variant is canary", () => {
        render(<DemoPanel {...defaults} variant="canary" />);
        expect(screen.getByText("Canary Ring")).toBeInTheDocument();
    });

    // Hot Reload Demo section
    it("renders the Hot Reload Demo steps", () => {
        render(<DemoPanel {...defaults} />);
        expect(screen.getByText("Hot Reload Demo")).toBeInTheDocument();
        expect(screen.getByText("Step 1")).toBeInTheDocument();
        expect(screen.getByText("Step 4")).toBeInTheDocument();
    });
});
