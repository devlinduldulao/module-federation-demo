import { memo } from "react";
import { cn } from "../lib/utils";
import type { RemoteHealth, RemoteStatus } from "../lib/health";
import type {
    KilledRemotes,
    RemoteVersionInfo,
    DeploymentVariant,
} from "../lib/demo";

interface DemoPanelProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly health: readonly RemoteHealth[];
    readonly killed: KilledRemotes;
    readonly onToggleKill: (id: string) => void;
    readonly onKillAll: () => void;
    readonly onRestoreAll: () => void;
    readonly versions: readonly RemoteVersionInfo[];
    readonly variant: DeploymentVariant;
    readonly onToggleVariant: () => void;
    readonly renderBenchmarks: readonly RenderBenchmark[];
}

const STATUS_CONFIG: Record<RemoteStatus, { label: string; color: string; dot: string }> = {
    online: { label: "Online", color: "text-chart-2", dot: "bg-chart-2" },
    offline: { label: "Offline", color: "text-destructive", dot: "bg-destructive" },
    checking: { label: "Checking", color: "text-muted-foreground", dot: "bg-muted-foreground" },
};

interface RenderBenchmark {
    readonly id: string;
    readonly label: string;
    readonly strategy: string;
    readonly detail: string;
    readonly firstTimingMs: number | null;
    readonly latestTimingMs: number | null;
    readonly runs: number;
}

const formatTiming = (timingMs: number | null): string =>
    timingMs === null ? "Not run" : `${timingMs}ms`;

const DemoPanel = memo<DemoPanelProps>(
    ({
        isOpen,
        onClose,
        health,
        killed,
        onToggleKill,
        onKillAll,
        onRestoreAll,
        versions,
        variant,
        onToggleVariant,
        renderBenchmarks,
    }) => {
        if (!isOpen) return null;

        const anyKilled = Object.values(killed).some(Boolean);
        const allKilled = Object.values(killed).every(Boolean);

        return (
            <>
                <button
                    type="button"
                    className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
                    aria-label="Close demo panel"
                    onClick={onClose}
                />
                <aside
                    className="fixed right-0 top-0 z-50 h-full w-full max-w-lg border-l border-border bg-background/95 backdrop-blur-enhanced overflow-y-auto"
                    role="dialog"
                    aria-label="Demo controls"
                >
                    <div className="p-6">
                        {/* Header */}
                        <div className="mb-8 flex items-start justify-between gap-4">
                            <div>
                                <span className="mb-2 block font-mono text-[10px] tracking-[0.3em] text-muted-foreground/70 uppercase">
                                    Live Demo Controls
                                </span>
                                <h3 className="font-sans font-semibold text-xl text-foreground">
                                    Federation Lab
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex size-10 items-center justify-center border border-border font-mono text-xs text-muted-foreground/70 transition-colors duration-200 hover:border-foreground hover:text-foreground"
                                aria-label="Close demo panel"
                            >
                                ×
                            </button>
                        </div>

                        {/* Section 1: Remote Health Monitor */}
                        <section className="mb-8" aria-label="Remote health status">
                            <div className="mb-4 flex items-center justify-between">
                                <span className="font-mono text-[11px] tracking-[0.3em] text-muted-foreground/70 uppercase">
                                    Remote Health
                                </span>
                                <span className="font-mono text-[10px] text-muted-foreground/70">
                                    Polling every 5s
                                </span>
                            </div>

                            <div className="space-y-0 divide-y divide-border border border-border">
                                {health.map((remote) => {
                                    const config = STATUS_CONFIG[remote.status];
                                    const isKilled = killed[remote.id];

                                    return (
                                        <div
                                            key={remote.id}
                                            className="flex items-center justify-between px-4 py-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={cn(
                                                        "h-2 w-2 rounded-full transition-colors duration-300",
                                                        isKilled ? "bg-destructive" : config.dot
                                                    )}
                                                />
                                                <div>
                                                    <span className="font-mono text-[11px] tracking-wider text-foreground uppercase block">
                                                        {remote.id}
                                                    </span>
                                                    <span className="font-mono text-[10px] text-muted-foreground/70">
                                                        :{remote.port}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {remote.latencyMs !== null && !isKilled && (
                                                    <span className="font-mono text-[10px] text-muted-foreground/70">
                                                        {remote.latencyMs}ms
                                                    </span>
                                                )}
                                                <span
                                                    className={cn(
                                                        "font-mono text-[10px] tracking-wider uppercase",
                                                        isKilled ? "text-destructive" : config.color
                                                    )}
                                                >
                                                    {isKilled ? "Killed" : config.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Section 2: Render Benchmark */}
                        <section className="mb-8" aria-label="Route render benchmark">
                            <div className="mb-4">
                                <span className="font-mono text-[11px] tracking-[0.3em] text-muted-foreground/70 uppercase block mb-1">
                                    Render Benchmark
                                </span>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    First run is preserved; latest run shows warm-cache navigation.
                                </p>
                            </div>

                            <div className="border border-border divide-y divide-border">
                                {renderBenchmarks.map((benchmark) => (
                                    <div key={benchmark.id} className="px-4 py-3">
                                        <div className="mb-3 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-[11px] tracking-wider text-foreground uppercase">
                                                    {benchmark.label}
                                                </span>
                                                <span className="font-mono text-[10px] text-muted-foreground/70 uppercase">
                                                    {benchmark.strategy}
                                                </span>
                                            </div>
                                            <span className="font-mono text-[10px] text-muted-foreground/70 uppercase">
                                                {benchmark.runs} run{benchmark.runs === 1 ? "" : "s"}
                                            </span>
                                        </div>
                                        <div className="mb-2 grid grid-cols-2 gap-3">
                                            <div>
                                                <span className="mb-1 block font-mono text-[9px] tracking-[0.2em] text-muted-foreground/70 uppercase">
                                                    First
                                                </span>
                                                <span className="font-mono text-[11px] text-primary">
                                                    {formatTiming(benchmark.firstTimingMs)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="mb-1 block font-mono text-[9px] tracking-[0.2em] text-muted-foreground/70 uppercase">
                                                    Latest
                                                </span>
                                                <span className="font-mono text-[11px] text-primary">
                                                    {formatTiming(benchmark.latestTimingMs)}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs leading-relaxed text-muted-foreground">
                                            {benchmark.detail}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section 3: Fault Isolation — Kill Switches */}
                        <section className="mb-8" aria-label="Fault isolation controls">
                            <div className="mb-4">
                                <span className="font-mono text-[11px] tracking-[0.3em] text-muted-foreground/70 uppercase block mb-1">
                                    Fault Isolation
                                </span>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Simulate a remote going down. The shell's ErrorBoundary catches the failure
                                    and renders a fallback — other modules keep running.
                                </p>
                            </div>

                            <div className="space-y-2 mb-4">
                                {health.map((remote) => {
                                    const isKilled = killed[remote.id];
                                    return (
                                        <button
                                            key={remote.id}
                                            type="button"
                                            onClick={() => onToggleKill(remote.id)}
                                            className={cn(
                                                "w-full border px-4 py-3 text-left transition-all duration-300 focus:outline-hidden flex items-center justify-between",
                                                isKilled
                                                    ? "border-destructive/40 bg-destructive/10"
                                                    : "border-border hover:border-ring hover:bg-card/70"
                                            )}
                                            aria-label={`${isKilled ? "Restore" : "Kill"} ${remote.id} module`}
                                            aria-pressed={isKilled}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={cn(
                                                        "font-mono text-[11px] tracking-[0.2em] uppercase",
                                                        isKilled ? "text-destructive" : "text-foreground"
                                                    )}
                                                >
                                                    {remote.id}
                                                </span>
                                                <span className="font-mono text-[10px] text-muted-foreground/70">
                                                    :{remote.port}
                                                </span>
                                            </div>
                                            <span
                                                className={cn(
                                                    "font-mono text-[10px] tracking-wider uppercase",
                                                    isKilled ? "text-destructive" : "text-chart-2"
                                                )}
                                            >
                                                {isKilled ? "DOWN" : "LIVE"}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onKillAll}
                                    disabled={allKilled}
                                    className={cn(
                                        "flex-1 border px-4 py-2.5 font-mono text-[10px] tracking-wider uppercase transition-all duration-300 focus:outline-hidden",
                                        allKilled
                                            ? "border-border text-muted-foreground/70 cursor-not-allowed"
                                            : "border-destructive/40 text-destructive hover:bg-destructive/10"
                                    )}
                                    aria-label="Kill all remote modules"
                                >
                                    Kill All
                                </button>
                                <button
                                    type="button"
                                    onClick={onRestoreAll}
                                    disabled={!anyKilled}
                                    className={cn(
                                        "flex-1 border px-4 py-2.5 font-mono text-[10px] tracking-wider uppercase transition-all duration-300 focus:outline-hidden",
                                        !anyKilled
                                            ? "border-border text-muted-foreground/70 cursor-not-allowed"
                                            : "border-chart-2/40 text-chart-2 hover:bg-chart-2/10"
                                    )}
                                    aria-label="Restore all remote modules"
                                >
                                    Restore All
                                </button>
                            </div>
                        </section>

                        {/* Section 4: Version Registry & A/B Deployment */}
                        <section className="mb-8" aria-label="Version registry and A/B deployment">
                            <div className="mb-4">
                                <span className="font-mono text-[11px] tracking-[0.3em] text-muted-foreground/70 uppercase block mb-1">
                                    A/B Deployment
                                </span>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Toggle between stable and canary deployment rings. In production,
                                    each remote could be deployed independently at different versions.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onToggleVariant}
                                className={cn(
                                    "w-full border px-4 py-4 mb-4 text-left transition-all duration-300 focus:outline-hidden",
                                    variant === "canary"
                                        ? "border-chart-4/40 bg-chart-4/10"
                                        : "border-primary/30 bg-primary/5"
                                )}
                                aria-label={`Switch to ${variant === "stable" ? "canary" : "stable"} deployment`}
                                aria-pressed={variant === "canary"}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span
                                        className={cn(
                                            "font-mono text-[11px] tracking-[0.3em] uppercase",
                                            variant === "canary" ? "text-chart-4" : "text-primary"
                                        )}
                                    >
                                        {variant === "stable" ? "Stable Ring" : "Canary Ring"}
                                    </span>
                                    <span className="font-mono text-[10px] text-muted-foreground/70 uppercase">
                                        Click to swap
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {variant === "stable"
                                        ? "Production-grade releases verified across the full test suite."
                                        : "Pre-release builds for early validation and feature flagging."}
                                </p>
                            </button>

                            <div className="border border-border divide-y divide-border">
                                {versions.map((v) => (
                                    <div key={v.id} className="flex items-center justify-between px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={cn(
                                                    "h-1.5 w-1.5 rounded-full",
                                                    v.variant === "canary" ? "bg-chart-4" : "bg-primary"
                                                )}
                                            />
                                            <span className="font-mono text-[11px] tracking-wider text-foreground uppercase">
                                                {v.id}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-mono text-[10px] text-muted-foreground">
                                                v{v.version}
                                            </span>
                                            <span className="font-mono text-[10px] text-muted-foreground/70">
                                                #{v.buildHash}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section 5: Independent Deployment Guide */}
                        <section aria-label="Independent deployment demo">
                            <div className="mb-4">
                                <span className="font-mono text-[11px] tracking-[0.3em] text-muted-foreground/70 uppercase block mb-1">
                                    Hot Reload Demo
                                </span>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Each remote runs its own dev server. Stop one, edit its code, and restart
                                    — the shell reloads only that module while others stay running.
                                </p>
                            </div>

                            <div className="border border-border divide-y divide-border">
                                <div className="px-4 py-3">
                                    <span className="font-mono text-[10px] text-primary block mb-1">Step 1</span>
                                    <p className="font-mono text-[11px] text-muted-foreground">
                                        Stop a single remote: <span className="text-foreground">Ctrl+C</span> in its terminal
                                    </p>
                                </div>
                                <div className="px-4 py-3">
                                    <span className="font-mono text-[10px] text-primary block mb-1">Step 2</span>
                                    <p className="font-mono text-[11px] text-muted-foreground">
                                        Navigate to that module — the shell shows the <span className="text-foreground">ErrorBoundary</span> fallback
                                    </p>
                                </div>
                                <div className="px-4 py-3">
                                    <span className="font-mono text-[10px] text-primary block mb-1">Step 3</span>
                                    <p className="font-mono text-[11px] text-muted-foreground">
                                        Edit the remote's source and run <span className="text-foreground">pnpm run dev</span> — it hot-reloads independently
                                    </p>
                                </div>
                                <div className="px-4 py-3">
                                    <span className="font-mono text-[10px] text-primary block mb-1">Step 4</span>
                                    <p className="font-mono text-[11px] text-muted-foreground">
                                        Click <span className="text-foreground">Retry</span> in the fallback — the module loads with your changes
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Footer */}
                        <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-6 font-mono text-[10px] tracking-wider text-muted-foreground/70 uppercase">
                            <span>Federation Lab</span>
                            <span>Demo Controls</span>
                        </div>
                    </div>
                </aside>
            </>
        );
    }
);

DemoPanel.displayName = "DemoPanel";

export default DemoPanel;
