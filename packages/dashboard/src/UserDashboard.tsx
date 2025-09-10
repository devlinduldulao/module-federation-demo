import React, { useMemo, memo } from "react";
import { cn } from "./lib/utils";
import type { DashboardStat, ActivityItem } from "./types";

// Mock data with better structure
const MOCK_STATS: readonly DashboardStat[] = [
  {
    id: "orders",
    label: "Total Orders",
    value: "156",
    emoji: "BOX",
    color: "from-blue-500 to-cyan-600",
    trend: { direction: "up", percentage: 23 },
  },
  {
    id: "spending",
    label: "Total Spent",
    value: "$12,847",
    emoji: "CASH",
    color: "from-green-500 to-emerald-600",
    trend: { direction: "up", percentage: 18 },
  },
  {
    id: "saved",
    label: "Money Saved",
    value: "$2,156",
    emoji: "SAVE",
    color: "from-purple-500 to-violet-600",
    trend: { direction: "up", percentage: 45 },
  },
  {
    id: "wishlist",
    label: "Wishlist Items",
    value: "24",
    emoji: "WISH",
    color: "from-pink-500 to-rose-600",
    trend: { direction: "up", percentage: 12 },
  },
] as const;

const MOCK_ACTIVITY: readonly ActivityItem[] = [
  {
    id: "1",
    message:
      "MacBook Pro M3 delivered successfully - Premium experience guaranteed!",
    timestamp: "2 hours ago",
    type: "success",
    icon: "OK",
  },
  {
    id: "2",
    message:
      "Added AirPods Pro and 2 other items to wishlist for Black Friday deals 🛍️",
    timestamp: "5 hours ago",
    type: "info",
    icon: "FAV",
  },
  {
    id: "3",
    message:
      "iPhone 15 Pro order #MF-2024-156 is being processed - Estimated delivery: Tomorrow",
    timestamp: "1 day ago",
    type: "warning",
    icon: "PROC",
  },
  {
    id: "4",
    message: "Payment of $2,749.98 processed successfully via Apple Pay",
    timestamp: "2 days ago",
    type: "success",
    icon: "PAY",
  },
  {
    id: "5",
    message: "Welcome bonus: $50 credit added to your account! Start shopping",
    timestamp: "1 week ago",
    type: "info",
    icon: "GIFT",
  },
] as const;

// Memoized components
const StatCard = memo<{
  stat: DashboardStat;
}>(({ stat }) => {
  const trendIcon = useMemo(() => {
    if (!stat.trend) return null;
    switch (stat.trend.direction) {
      case "up":
        return "📈";
      case "down":
        return "📉";
      default:
        return "➡️";
    }
  }, [stat.trend]);

  const trendColor = useMemo(() => {
    if (!stat.trend) return "";
    switch (stat.trend.direction) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  }, [stat.trend]);

  return (
    <article
      className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-purple-200 relative overflow-hidden"
      role="article"
      aria-label={`Statistic: ${stat.label}`}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

      <div className="relative z-10">
        <div className="flex justify-center mb-6">
          <div
            className={cn(
              "w-16 h-16 bg-gradient-to-br rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 relative overflow-hidden",
              stat.color
            )}
            role="img"
            aria-label={`${stat.label} icon`}
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="relative">{stat.emoji}</span>
          </div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-800 mb-3 group-hover:text-purple-600 transition-colors duration-300">
            {stat.value}
          </div>
          <div className="text-gray-800 mb-4 font-medium">{stat.label}</div>
          {stat.trend && (
            <div
              className={cn(
                "inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full text-sm font-semibold",
                stat.trend.direction === "up" && "bg-green-100 text-green-700",
                stat.trend.direction === "down" && "bg-red-100 text-red-700",
                stat.trend.direction === "neutral" &&
                  "bg-gray-100 text-gray-700"
              )}
            >
              <span>{trendIcon}</span>
              <span>{stat.trend.percentage}% vs last month</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
});

StatCard.displayName = "StatCard";

const ActivityItem = memo<{
  activity: ActivityItem;
}>(({ activity }) => {
  const statusColors = {
    success: "bg-green-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  } as const;

  const backgroundColors = {
    success: "hover:bg-green-50",
    info: "hover:bg-blue-50",
    warning: "hover:bg-yellow-50",
    error: "hover:bg-red-50",
  } as const;

  return (
    <article
      className={cn(
        "group flex items-start gap-4 p-4 bg-gray-50 rounded-xl transition-all duration-300 cursor-pointer",
        backgroundColors[activity.type]
      )}
      role="article"
      aria-label={`Activity: ${activity.message}`}
    >
      <div className="flex items-center gap-3 flex-shrink-0 mt-1">
        <div
          className={cn(
            "w-3 h-3 rounded-full transition-all duration-300 group-hover:scale-125",
            statusColors[activity.type]
          )}
          aria-hidden="true"
        />
        {activity.icon && (
          <div className="text-lg group-hover:scale-110 transition-transform duration-300">
            <span role="img" aria-hidden="true">
              {activity.icon}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-gray-800 font-medium leading-relaxed block">
          {activity.message}
        </span>
        <time
          className="text-sm text-gray-700 mt-1 block font-medium"
          dateTime={activity.timestamp}
        >
          {activity.timestamp}
        </time>
      </div>
    </article>
  );
});

ActivityItem.displayName = "ActivityItem";

// Main component
function UserDashboard(): JSX.Element {
  const lastUpdated = useMemo(() => {
    return new Date().toLocaleString();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto" role="main">
      <header className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl mb-6">
          <span
            className="text-4xl animate-pulse"
            role="img"
            aria-label="dashboard"
          >
            📊
          </span>
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Dashboard Overview
        </h2>
        <p className="text-gray-800 text-lg max-w-2xl mx-auto font-medium">
          Welcome back, Alex! Here's your comprehensive account overview with
          real-time insights and activity tracking.
        </p>
      </header>

      {/* User Welcome Card */}
      <section className="mb-12">
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-2xl p-8 text-gray-200 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-white/10 translate-x-[-100%] animate-pulse"
            style={{ animationDuration: "4s" }}
          />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">
                Welcome back, Developer!
              </h3>
              <p className="text-gray-200 text-lg">
                You've saved $2,156 with smart shopping choices this month.
              </p>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Account verified
                </span>
                <span>•</span>
                <span>Premium member since 2024</span>
                <span>•</span>
                <span>Top 5% spender</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">STAR</div>
              <div className="text-sm opacity-90">Member Level</div>
              <div className="text-2xl font-bold">Platinum</div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Grid */}
      <section className="mb-12" aria-label="Account statistics">
        <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
          <span>PERF</span>
          <span>Performance Metrics</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {MOCK_STATS.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow duration-300">
          <header className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-2">
              <span role="img" aria-label="activity">
                �
              </span>
              <span>Recent Activity</span>
            </h3>
            <p className="text-gray-800 font-medium">
              Stay up to date with your latest transactions and account
              activities
            </p>
          </header>
          <div className="space-y-4" role="list" aria-label="Recent activities">
            {MOCK_ACTIVITY.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      </section>

      {/* Module Info */}
      <footer className="bg-gradient-to-r from-purple-100 via-pink-100 to-indigo-100 rounded-2xl p-8 text-center border border-purple-200">
        <div className="mb-4">
          <span
            className="text-4xl animate-bounce"
            role="img"
            aria-label="module federation"
          >
            🚀
          </span>
        </div>
        <h4 className="text-xl font-bold text-purple-800 mb-3">
          Micro-Frontend Architecture Demo
        </h4>
        <p className="text-purple-700 mb-4 max-w-2xl mx-auto">
          This dashboard module showcases independent deployment capabilities.
          It can be updated, scaled, and maintained separately from other
          modules without affecting the entire application.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-purple-600">
          <span className="flex items-center gap-1">
            <span>⚡</span>
            <span>Independent deployments</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span>🔄</span>
            <span>Hot reloading</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span>📦</span>
            <span>Zero coupling</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span>🛡️</span>
            <span>Fault isolation</span>
          </span>
        </div>
        <p className="text-xs text-purple-600 mt-4">
          Last updated: {lastUpdated}
        </p>
      </footer>
    </div>
  );
}

UserDashboard.displayName = "UserDashboard";

export default UserDashboard;
