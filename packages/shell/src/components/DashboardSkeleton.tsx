import { memo } from "react";

const DashboardSkeleton = memo(() => (
  <div
    role="status"
    className="w-full max-w-7xl mx-auto animate-pulse"
  >
    {/* Header Skeleton */}
    <div className="mb-12">
      <div className="h-3 w-24 bg-elevated mb-4" />
      <div className="h-10 w-80 bg-elevated mb-3" />
      <div className="h-4 w-[500px] max-w-full bg-muted" />
    </div>

    {/* Welcome Card Skeleton */}
    <div className="mb-12 border border-edge p-8">
      <div className="flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="flex-1">
          <div className="h-7 w-72 bg-elevated mb-3" />
          <div className="h-4 w-96 bg-muted mb-4" />
          <div className="flex items-center gap-4">
            <div className="h-3 w-28 bg-muted" />
            <div className="h-3 w-24 bg-muted" />
          </div>
        </div>
        <div>
          <div className="w-20 h-20 bg-surface relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/30 to-transparent animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
          </div>
        </div>
      </div>
    </div>

    {/* Stats Grid Skeleton */}
    <div className="mb-12">
      <div className="h-3 w-32 bg-muted mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-edge">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-noir p-6">
            <div className="h-2.5 w-20 bg-muted mb-4" />
            <div className="h-10 w-28 bg-elevated mb-3" />
            <div className="h-3 w-24 bg-muted" />
          </div>
        ))}
      </div>
    </div>

    {/* Activity Section Skeleton */}
    <div className="mb-10 border border-edge p-8">
      <div className="h-5 w-40 bg-elevated mb-2" />
      <div className="h-3 w-72 bg-muted mb-8" />
      <div className="space-y-0 divide-y divide-edge">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-start gap-4 py-4">
            <div className="w-2 h-2 rounded-full bg-elevated flex-shrink-0 mt-1.5" />
            <div className="flex-1">
              <div className="h-4 bg-elevated mb-2 w-full" />
              <div className="h-3 bg-muted w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Footer Skeleton */}
    <div className="border border-edge p-8">
      <div className="h-4 w-64 bg-elevated mx-auto mb-3" />
      <div className="h-3 w-96 bg-muted mx-auto mb-6" />
      <div className="flex flex-wrap justify-center gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-3 w-28 bg-muted" />
        ))}
      </div>
    </div>

    {/* Streaming indicator */}
    <div className="mt-12 pt-6 border-t border-edge">
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-citrine/40"
              style={{ animation: `subtlePulse 1.4s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
        <span className="font-mono text-[11px] text-dim tracking-wider">
          STREAMING DASHBOARD :3003
        </span>
      </div>
    </div>
    <span className="sr-only">Loading dashboard...</span>
  </div>
));

DashboardSkeleton.displayName = "DashboardSkeleton";

export default DashboardSkeleton;
