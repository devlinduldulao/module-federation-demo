import { useMemo, memo } from "react";
import { cn } from "./lib/utils";
import type { DashboardStat, ActivityItem } from "./types";

const MOCK_STATS: readonly DashboardStat[] = [
  {
    id: "orders",
    label: "Total Orders",
    value: "156",
    emoji: "",
    color: "text-ice",
    trend: { direction: "up", percentage: 23 },
  },
  {
    id: "spending",
    label: "Total Spent",
    value: "$12,847",
    emoji: "",
    color: "text-mint",
    trend: { direction: "up", percentage: 18 },
  },
  {
    id: "saved",
    label: "Money Saved",
    value: "$2,156",
    emoji: "",
    color: "text-citrine",
    trend: { direction: "up", percentage: 45 },
  },
  {
    id: "wishlist",
    label: "Wishlist Items",
    value: "24",
    emoji: "",
    color: "text-burnt",
    trend: { direction: "up", percentage: 12 },
  },
] as const;

const MOCK_ACTIVITY: readonly ActivityItem[] = [
  {
    id: "1",
    message: "MacBook Pro M3 delivered successfully",
    timestamp: "2 hours ago",
    type: "success",
    icon: "",
  },
  {
    id: "2",
    message: "Added AirPods Pro to wishlist for price tracking",
    timestamp: "5 hours ago",
    type: "info",
    icon: "",
  },
  {
    id: "3",
    message: "iPhone 15 Pro order #MF-2024-156 is being processed",
    timestamp: "1 day ago",
    type: "warning",
    icon: "",
  },
  {
    id: "4",
    message: "Payment of $2,749.98 processed via Apple Pay",
    timestamp: "2 days ago",
    type: "success",
    icon: "",
  },
  {
    id: "5",
    message: "Welcome bonus: $50 credit added to your account",
    timestamp: "1 week ago",
    type: "info",
    icon: "",
  },
] as const;

// Stat card
const StatCard = memo<{ stat: DashboardStat; index: number }>(
  ({ stat, index }) => {
    const trendColor = stat.trend?.direction === "up" ? "text-mint" : stat.trend?.direction === "down" ? "text-rose" : "text-stone";

    return (
      <article
        className="group bg-noir p-6 transition-all duration-300 hover:bg-surface animate-count-up"
        style={{ animationDelay: `${index * 120}ms` }}
        role="article"
        aria-label={`${stat.label}: ${stat.value}`}
      >
        <span className="font-mono text-[10px] tracking-[0.2em] text-dim uppercase block mb-4">
          {stat.label}
        </span>
        <div className={cn("font-display text-4xl lg:text-5xl italic tracking-tight mb-3", stat.color)}>
          {stat.value}
        </div>
        {stat.trend && (
          <span className={cn("font-mono text-xs", trendColor)}>
            {stat.trend.direction === "up" ? "+" : stat.trend.direction === "down" ? "-" : ""}
            {stat.trend.percentage}% vs last month
          </span>
        )}
      </article>
    );
  }
);

StatCard.displayName = "StatCard";

// Activity row
const ActivityRow = memo<{ activity: ActivityItem; index: number }>(
  ({ activity, index }) => {
    const dotColors = {
      success: "bg-mint",
      info: "bg-ice",
      warning: "bg-burnt",
      error: "bg-rose",
    } as const;

    return (
      <article
        className="group activity-item flex items-start gap-4 py-4 hover:bg-surface/50 transition-colors duration-200 pl-4"
        role="article"
        aria-label={`Activity: ${activity.message}`}
      >
        <div
          className={cn(
            "w-2 h-2 rounded-full flex-shrink-0 mt-1.5 transition-transform duration-200 group-hover:scale-150",
            dotColors[activity.type]
          )}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <span className="text-stone text-sm leading-relaxed block group-hover:text-cream transition-colors duration-200">
            {activity.message}
          </span>
          <time className="font-mono text-[11px] text-dim mt-1 block" dateTime={activity.timestamp}>
            {activity.timestamp}
          </time>
        </div>
      </article>
    );
  }
);

ActivityRow.displayName = "ActivityRow";

// Main component
function UserDashboard() {
  const lastUpdated = useMemo(() => new Date().toLocaleString(), []);

  return (
    <div className="w-full max-w-7xl mx-auto animate-fade-in" role="main">
      {/* Header */}
      <header className="mb-12">
        <span className="font-mono text-[11px] tracking-[0.3em] text-dim uppercase block mb-3">
          Analytics Overview
        </span>
        <h2 className="font-display text-5xl lg:text-6xl italic text-cream tracking-tight leading-none mb-3">
          Dashboard
        </h2>
        <p className="text-stone text-sm max-w-xl">
          Welcome back. Here's your account overview with real-time insights and activity tracking across all modules.
        </p>
      </header>

      {/* Welcome banner */}
      <section className="mb-12 border border-edge">
        <div className="p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-ice via-citrine to-mint" />
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div>
              <h3 className="font-display text-2xl italic text-cream mb-2">
                Welcome back, Developer
              </h3>
              <p className="text-stone text-sm leading-relaxed mb-4">
                You've saved $2,156 with smart shopping choices this month. Your account is performing above average.
              </p>
              <div className="flex items-center gap-4 font-mono text-[11px] text-dim">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-mint" />
                  Account verified
                </span>
                <span className="text-edge">|</span>
                <span>Premium member since 2024</span>
                <span className="text-edge">|</span>
                <span>Top 5% spender</span>
              </div>
            </div>
            <div className="text-right hidden md:block">
              <div className="border border-edge p-4">
                <span className="font-mono text-[10px] tracking-[0.2em] text-dim uppercase block mb-1">Level</span>
                <span className="font-display text-2xl italic text-citrine">Platinum</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Grid */}
      <section className="mb-12" aria-label="Account statistics">
        <div className="flex items-center justify-between mb-6">
          <span className="font-mono text-[11px] tracking-[0.3em] text-dim uppercase">
            Performance Metrics
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-edge">
          {MOCK_STATS.map((stat, index) => (
            <StatCard key={stat.id} stat={stat} index={index} />
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="mb-10">
        <div className="border border-edge">
          <div className="p-8 pb-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-xl italic text-cream">
                Activity Stream
              </h3>
              <span className="font-mono text-[11px] text-dim">Real-time</span>
            </div>
            <p className="text-stone text-sm mb-6">
              Latest transactions and account events
            </p>
          </div>
          <div className="divide-y divide-edge" role="list" aria-label="Recent activities">
            {MOCK_ACTIVITY.map((activity, index) => (
              <ActivityRow key={activity.id} activity={activity} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border border-edge p-8 text-center">
        <h4 className="font-display text-xl italic text-cream mb-3">
          Micro-Frontend Architecture
        </h4>
        <p className="text-stone text-sm mb-6 max-w-2xl mx-auto leading-relaxed">
          This dashboard module operates independently — it can be deployed, scaled, and maintained without affecting other modules.
        </p>
        <div className="flex flex-wrap justify-center gap-6 font-mono text-[11px] tracking-wider text-dim uppercase mb-6">
          <span>Independent Deploy</span>
          <span className="text-edge-bright">/</span>
          <span>Hot Reload</span>
          <span className="text-edge-bright">/</span>
          <span>Zero Coupling</span>
          <span className="text-edge-bright">/</span>
          <span>Fault Isolation</span>
        </div>
        <p className="font-mono text-[11px] text-dim">
          Last updated: {lastUpdated}
        </p>
      </footer>
    </div>
  );
}

UserDashboard.displayName = "UserDashboard";

export default UserDashboard;
