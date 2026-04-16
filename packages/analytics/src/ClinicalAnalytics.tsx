import { memo, useMemo } from "react";
import type { AnalyticsStat, ClinicalActivity } from "./types";
import { useActiveTheme } from "./lib/theme";
import "./index.css";

// Mock stats
const MOCK_STATS: readonly AnalyticsStat[] = [
    { label: "Active Patients", value: 247, trend: "up", trendValue: "+12%" },
    { label: "Prescriptions Today", value: 89, trend: "up", trendValue: "+8%" },
    { label: "Critical Alerts", value: 3, trend: "down", trendValue: "-25%" },
    { label: "Avg Wait Time", value: "14m", trend: "down", trendValue: "-18%" },
] as const;

// Mock activity feed
const MOCK_ACTIVITIES: readonly ClinicalActivity[] = [
    { id: 1, description: "Patient Sarah Chen admitted to Ward 3B", timestamp: "2 min ago", type: "admission" },
    { id: 2, description: "Critical lab result flagged for Michael Torres", timestamp: "8 min ago", type: "alert" },
    { id: 3, description: "Prescription filled for Lisa Nguyen — Metformin 500mg", timestamp: "15 min ago", type: "prescription" },
    { id: 4, description: "Patient James Rodriguez discharged — follow-up in 7 days", timestamp: "22 min ago", type: "discharge" },
    { id: 5, description: "Lab results received for Anna Kowalski — CBC panel", timestamp: "31 min ago", type: "lab" },
    { id: 6, description: "New admission: David Park — scheduled for MRI", timestamp: "45 min ago", type: "admission" },
    { id: 7, description: "Alert resolved: Emily Watson vitals stabilized", timestamp: "1 hr ago", type: "alert" },
    { id: 8, description: "Prescription renewal approved for Robert Fischer", timestamp: "1 hr ago", type: "prescription" },
] as const;

const TREND_STYLES = {
    up: { symbol: "↑", color: "text-mint" },
    down: { symbol: "↓", color: "text-rose" },
    stable: { symbol: "→", color: "text-stone" },
} as const;

const ACTIVITY_TYPE_LABELS: Record<ClinicalActivity["type"], { icon: string; color: string }> = {
    admission: { icon: "→", color: "text-mint" },
    discharge: { icon: "←", color: "text-citrine" },
    alert: { icon: "!", color: "text-rose" },
    prescription: { icon: "Rx", color: "text-stone" },
    lab: { icon: "◉", color: "text-dim" },
};

// Stat card
const StatCard = memo<{ stat: AnalyticsStat; index: number }>(({ stat, index }) => {
    const trend = TREND_STYLES[stat.trend];
    const isPositive = stat.label === "Critical Alerts" ? stat.trend === "down" : stat.trend === "up";

    return (
        <article
            className="border border-edge p-8 sm:p-10 animate-fade-in-up flex flex-col justify-center min-h-[180px] shadow-sm"
            style={{ animationDelay: `${index * 100}ms` }}
            aria-label={`${stat.label}: ${stat.value}`}
        >
            <span className="font-mono text-[10px] tracking-[0.2em] text-dim uppercase block mb-4">
                {stat.label}
            </span>
            <div className="flex items-end justify-between">
                <span className="font-display text-5xl lg:text-6xl italic text-cream leading-none mt-2">
                    {stat.value}
                </span>
                <span className={`font-mono text-xs ${isPositive ? "text-mint" : "text-rose"}`}>
                    {trend.symbol} {stat.trendValue}
                </span>
            </div>
        </article>
    );
});

StatCard.displayName = "StatCard";

// Activity item
const ActivityItem = memo<{ activity: ClinicalActivity; index: number }>(({ activity, index }) => {
    const typeLabel = ACTIVITY_TYPE_LABELS[activity.type];

    return (
        <article
            className="flex items-start gap-6 py-6 animate-fade-in-up"
            style={{ animationDelay: `${index * 60}ms` }}
            aria-label={`Activity: ${activity.description}`}
        >
            <span className={`font-mono text-xs ${typeLabel.color} w-6 text-center pt-0.5`}>
                {typeLabel.icon}
            </span>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-cream leading-relaxed">{activity.description}</p>
                <span className="font-mono text-[10px] text-dim mt-1 block">{activity.timestamp}</span>
            </div>
        </article>
    );
});

ActivityItem.displayName = "ActivityItem";

// Welcome banner
const WelcomeBanner = memo(() => (
    <div className="border border-edge p-10 sm:p-12 mb-16 animate-fade-in-up shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <span className="font-mono text-[10px] tracking-[0.2em] text-dim uppercase block mb-2">
                    Welcome back
                </span>
                <h3 className="font-display text-4xl lg:text-5xl italic text-cream mt-2">Dr. Thompson</h3>
            </div>
            <div className="flex items-center gap-4 font-mono text-[10px] text-dim">
                <span>Shift: Day</span>
                <span className="text-edge-bright">&middot;</span>
                <span>Ward: General</span>
                <span className="text-edge-bright">&middot;</span>
                <span className="text-mint">On Duty</span>
            </div>
        </div>
    </div>
));

WelcomeBanner.displayName = "WelcomeBanner";

// Main component
function ClinicalAnalytics() {
    const { label: themeLabel } = useActiveTheme();

    const { stats, activities } = useMemo(
        () => ({
            stats: MOCK_STATS,
            activities: MOCK_ACTIVITIES,
        }),
        []
    );

    return (
        <div className="max-w-7xl w-full mx-auto px-6 sm:px-8 lg:px-12 py-12 lg:py-24 animate-fade-in" role="main">
            {/* Header */}
            <header className="mb-16 lg:mb-24 animate-fade-in-up border-b border-edge pb-12">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <span className="font-mono text-[11px] tracking-[0.3em] text-dim uppercase block mb-3">
                            Clinical Overview
                        </span>
                        <h2 className="font-display text-5xl lg:text-6xl italic text-cream tracking-tight leading-none mb-3">
                            Analytics
                        </h2>
                        <p className="text-stone text-sm">
                            Real-time clinical metrics, patient activity, and operational insights.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 self-start lg:self-auto">
                        <span className="font-mono text-[10px] tracking-[0.3em] text-dim uppercase">
                            Theme
                        </span>
                        <span className="border border-edge bg-surface/70 px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-stone uppercase">
                            {themeLabel}
                        </span>
                    </div>
                </div>
            </header>

            {/* Welcome banner */}
            <WelcomeBanner />

            {/* Stats grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-16" aria-label="Clinical statistics">
                {stats.map((stat, index) => (
                    <StatCard key={stat.label} stat={stat} index={index} />
                ))}
            </section>

            {/* Activity feed */}
            <section className="border border-edge p-10 sm:p-12 shadow-lg" aria-label="Clinical activity">
                <h3 className="font-mono text-[11px] tracking-[0.3em] text-dim uppercase mb-6">
                    Recent Activity
                </h3>
                <div className="divide-y divide-edge">
                    {activities.map((activity, index) => (
                        <ActivityItem key={activity.id} activity={activity} index={index} />
                    ))}
                </div>
            </section>
        </div>
    );
}

ClinicalAnalytics.displayName = "ClinicalAnalytics";

export default ClinicalAnalytics;
