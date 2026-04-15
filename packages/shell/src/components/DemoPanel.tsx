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
}

const STATUS_CONFIG: Record<RemoteStatus, { label: string; color: string; dot: string }> = {
    online: { label: "Online", color: "text-mint", dot: "bg-mint" },
    offline: { label: "Offline", color: "text-rose", dot: "bg-rose" },
    checking: { label: "Checking", color: "text-stone", dot: "bg-stone" },
};

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
    }) => {
        if (!isOpen) return null;

        const anyKilled = Object.values(killed).some(Boolean);
        const allKilled = Object.values(killed).every(Boolean);

        return (
            <>
                <button
                    type="button"
                    className="fixed inset-0 z-40 bg-noir/60 backdrop-blur-sm"
                    aria-label="Close demo panel"
                    onClick={onClose}
                />
                <aside
                    className="fixed right-0 top-0 z-50 h-full w-full max-w-lg border-l border-edge bg-noir/95 backdrop-blur-enhanced overflow-y-auto"
                    role="dialog"
                    aria-label="Demo controls"
                >
                    <div className="p-6">
                        {/* Header */}
                        <div className="mb-8 flex items-start justify-between gap-4">
                            <div>
                                <span className="mb-2 block font-mono text-[10px] tracking-[0.3em] text-dim uppercase">
                                    Live Demo Controls
                                </span>
                                <h3 className="font-display text-3xl italic text-cream">
                                    Federation Lab
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex size-10 items-center justify-center border border-edge font-mono text-xs text-dim transition-colors duration-200 hover:border-cream hover:text-cream"
                                aria-label="Close demo panel"
                            >
                                ×
                            </button>
                        </div>

                        {/* Section 1: Remote Health Monitor */}
                        <section className="mb-8" aria-label="Remote health status">
                            <div className="mb-4 flex items-center justify-between">
                                <span className="font-mono text-[11px] tracking-[0.3em] text-dim uppercase">
                                    Remote Health
                                </span>
                                <span className="font-mono text-[10px] text-dim">
                                    Polling every 5s
                                </span>
                            </div>

                            <div className="space-y-0 divide-y divide-edge border border-edge">
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
                                                        isKilled ? "bg-rose" : config.dot
                                                    )}
                                                />
                                                <div>
                                                    <span className="font-mono text-[11px] tracking-wider text-cream uppercase block">
                                                        {remote.id}
                                                    </span>
                                                    <span className="font-mono text-[10px] text-dim">
                                                        :{remote.port}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {remote.latencyMs !== null && !isKilled && (
                                                    <span className="font-mono text-[10px] text-dim">
                                                        {remote.latencyMs}ms
                                                    </span>
                                                )}
                                                <span
                                                    className={cn(
                                                        "font-mono text-[10px] tracking-wider uppercase",
                                                        isKilled ? "text-rose" : config.color
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

                        {/* Section 2: Fault Isolation — Kill Switches */}
                        <section className="mb-8" aria-label="Fault isolation controls">
                            <div className="mb-4">
                                <span className="font-mono text-[11px] tracking-[0.3em] text-dim uppercase block mb-1">
                                    Fault Isolation
                                </span>
                                <p className="text-sm text-stone leading-relaxed">
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
                                                    ? "border-rose/40 bg-rose/10"
                                                    : "border-edge hover:border-edge-bright hover:bg-surface/70"
                                            )}
                                            aria-label={`${isKilled ? "Restore" : "Kill"} ${remote.id} module`}
                                            aria-pressed={isKilled}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={cn(
                                                        "font-mono text-[11px] tracking-[0.2em] uppercase",
                                                        isKilled ? "text-rose" : "text-cream"
                                                    )}
                                                >
                                                    {remote.id}
                                                </span>
                                                <span className="font-mono text-[10px] text-dim">
                                                    :{remote.port}
                                                </span>
                                            </div>
                                            <span
                                                className={cn(
                                                    "font-mono text-[10px] tracking-wider uppercase",
                                                    isKilled ? "text-rose" : "text-mint"
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
                                            ? "border-edge text-dim cursor-not-allowed"
                                            : "border-rose/40 text-rose hover:bg-rose/10"
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
                                            ? "border-edge text-dim cursor-not-allowed"
                                            : "border-mint/40 text-mint hover:bg-mint/10"
                                    )}
                                    aria-label="Restore all remote modules"
                                >
                                    Restore All
                                </button>
                            </div>
                        </section>

                        {/* Section 3: Version Registry & A/B Deployment */}
                        <section className="mb-8" aria-label="Version registry and A/B deployment">
                            <div className="mb-4">
                                <span className="font-mono text-[11px] tracking-[0.3em] text-dim uppercase block mb-1">
                                    A/B Deployment
                                </span>
                                <p className="text-sm text-stone leading-relaxed">
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
                                        ? "border-burnt/40 bg-burnt/10"
                                        : "border-citrine/30 bg-citrine/5"
                                )}
                                aria-label={`Switch to ${variant === "stable" ? "canary" : "stable"} deployment`}
                                aria-pressed={variant === "canary"}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span
                                        className={cn(
                                            "font-mono text-[11px] tracking-[0.3em] uppercase",
                                            variant === "canary" ? "text-burnt" : "text-citrine"
                                        )}
                                    >
                                        {variant === "stable" ? "Stable Ring" : "Canary Ring"}
                                    </span>
                                    <span className="font-mono text-[10px] text-dim uppercase">
                                        Click to swap
                                    </span>
                                </div>
                                <p className="text-sm text-stone">
                                    {variant === "stable"
                                        ? "Production-grade releases verified across the full test suite."
                                        : "Pre-release builds for early validation and feature flagging."}
                                </p>
                            </button>

                            <div className="border border-edge divide-y divide-edge">
                                {versions.map((v) => (
                                    <div key={v.id} className="flex items-center justify-between px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={cn(
                                                    "h-1.5 w-1.5 rounded-full",
                                                    v.variant === "canary" ? "bg-burnt" : "bg-citrine"
                                                )}
                                            />
                                            <span className="font-mono text-[11px] tracking-wider text-cream uppercase">
                                                {v.id}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-mono text-[10px] text-stone">
                                                v{v.version}
                                            </span>
                                            <span className="font-mono text-[10px] text-dim">
                                                #{v.buildHash}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section 4: Independent Deployment Guide */}
                        <section aria-label="Independent deployment demo">
                            <div className="mb-4">
                                <span className="font-mono text-[11px] tracking-[0.3em] text-dim uppercase block mb-1">
                                    Hot Reload Demo
                                </span>
                                <p className="text-sm text-stone leading-relaxed">
                                    Each remote runs its own dev server. Stop one, edit its code, and restart
                                    — the shell reloads only that module while others stay running.
                                </p>
                            </div>

                            <div className="border border-edge divide-y divide-edge">
                                <div className="px-4 py-3">
                                    <span className="font-mono text-[10px] text-citrine block mb-1">Step 1</span>
                                    <p className="font-mono text-[11px] text-stone">
                                        Stop a single remote: <span className="text-cream">Ctrl+C</span> in its terminal
                                    </p>
                                </div>
                                <div className="px-4 py-3">
                                    <span className="font-mono text-[10px] text-citrine block mb-1">Step 2</span>
                                    <p className="font-mono text-[11px] text-stone">
                                        Navigate to that module — the shell shows the <span className="text-cream">ErrorBoundary</span> fallback
                                    </p>
                                </div>
                                <div className="px-4 py-3">
                                    <span className="font-mono text-[10px] text-citrine block mb-1">Step 3</span>
                                    <p className="font-mono text-[11px] text-stone">
                                        Edit the remote's source and run <span className="text-cream">npm run dev</span> — it hot-reloads independently
                                    </p>
                                </div>
                                <div className="px-4 py-3">
                                    <span className="font-mono text-[10px] text-citrine block mb-1">Step 4</span>
                                    <p className="font-mono text-[11px] text-stone">
                                        Click <span className="text-cream">Retry</span> in the fallback — the module loads with your changes
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Footer */}
                        <div className="mt-8 flex items-center justify-between gap-4 border-t border-edge pt-6 font-mono text-[10px] tracking-wider text-dim uppercase">
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
