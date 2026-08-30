import { memo, useMemo } from "react";
import type { AnalyticsStat, ClinicalActivity } from "./types";
import { useActiveTheme } from "./lib/theme";
import SharedStateBar from "./components/SharedStateBar";
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
    up: { symbol: "↑", color: "text-chart-2" },
    down: { symbol: "↓", color: "text-destructive" },
    stable: { symbol: "→", color: "text-muted-foreground" },
} as const;

const ACTIVITY_TYPE_LABELS: Record<ClinicalActivity["type"], { icon: string; color: string }> = {
    admission: { icon: "→", color: "text-chart-2" },
    discharge: { icon: "←", color: "text-primary" },
    alert: { icon: "!", color: "text-destructive" },
    prescription: { icon: "Rx", color: "text-muted-foreground" },
    lab: { icon: "◉", color: "text-muted-foreground/70" },
};

// Stat card
const StatCard = memo<{ stat: AnalyticsStat; index: number }>(({ stat, index }) => {
    const trend = TREND_STYLES[stat.trend];
    const isPositive = stat.label === "Critical Alerts" ? stat.trend === "down" : stat.trend === "up";

    return (
        <article
            className="border border-border p-4 sm:p-5 animate-fade-in-up flex flex-col justify-center min-h-[96px] shadow-sm rounded-lg"
            style={{ animationDelay: `${index * 100}ms` }}
            aria-label={`${stat.label}: ${stat.value}`}
        >
            <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase block mb-2">
                {stat.label}
            </span>
            <div className="flex items-end justify-between gap-2">
                <span className="font-sans font-semibold text-2xl sm:text-3xl text-foreground leading-none">
                    {stat.value}
                </span>
                <span className={`font-mono text-[11px] ${isPositive ? "text-chart-2" : "text-destructive"}`}>
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
            className="flex items-start gap-3 py-3.5 animate-fade-in-up"
            style={{ animationDelay: `${index * 60}ms` }}
            aria-label={`Activity: ${activity.description}`}
        >
            <span className={`font-mono text-[11px] ${typeLabel.color} w-5 text-center pt-0.5`}>
                {typeLabel.icon}
            </span>
            <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">{activity.description}</p>
                <span className="font-mono text-[10px] text-muted-foreground/70 mt-0.5 block">{activity.timestamp}</span>
            </div>
        </article>
    );
});

ActivityItem.displayName = "ActivityItem";

// Welcome banner
const WelcomeBanner = memo(() => (
    <div className="border border-border p-4 sm:p-5 mb-8 animate-fade-in-up shadow-lg rounded-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
                <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase block mb-1">
                    Welcome back
                </span>
                <h3 className="font-sans font-semibold text-lg sm:text-xl text-foreground">Dr. Thompson</h3>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground/70">
                <span>Shift: Day</span>
                <span className="text-ring">&middot;</span>
                <span>Ward: General</span>
                <span className="text-ring">&middot;</span>
                <span className="text-chart-2">On Duty</span>
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
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in" role="main">
            {/* Header */}
            <header className="mb-8 lg:mb-10 animate-fade-in-up border-b border-border pb-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground/70 uppercase block mb-2">
                            Clinical Overview
                        </span>
                        <h2 className="font-sans font-semibold text-2xl sm:text-3xl lg:text-4xl text-foreground tracking-tight leading-snug mb-2">
                            Analytics
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Real-time clinical metrics, patient activity, and operational insights.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 self-start lg:self-auto">
                        <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground/70 uppercase">
                            Theme
                        </span>
                        <span className="border border-border bg-card/70 px-2.5 py-1 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase rounded-md">
                            {themeLabel}
                        </span>
                    </div>
                </div>
            </header>

            {/* Client state (zustand) + server state (TanStack Query), both local to this remote. */}
            <div className="mb-6 border border-border rounded-lg px-4 py-3">
              <SharedStateBar />
            </div>

            {/* Welcome banner */}
            <WelcomeBanner />

            {/* Stats grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8" aria-label="Clinical statistics">
                {stats.map((stat, index) => (
                    <StatCard key={stat.label} stat={stat} index={index} />
                ))}
            </section>

            {/* Activity feed */}
            <section className="border border-border p-4 sm:p-5 shadow-lg rounded-lg" aria-label="Clinical activity">
                <h3 className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground/70 uppercase mb-3">
                    Recent Activity
                </h3>
                <div className="divide-y divide-border">
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
