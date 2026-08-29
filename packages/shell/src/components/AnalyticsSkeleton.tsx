import { memo } from "react";

const AnalyticsSkeleton = memo(() => (
    <div role="status" className="w-full mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-8 lg:mb-10 border-b border-border pb-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                    <div className="h-2.5 w-28 bg-muted mb-2" />
                    <div className="h-7 w-40 bg-muted mb-2" />
                    <div className="h-3 w-full max-w-md bg-muted" />
                </div>
            </div>
        </div>

        {/* Welcome banner skeleton */}
        <div className="border border-border p-4 sm:p-5 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <div className="h-2.5 w-20 bg-muted mb-2" />
                    <div className="h-5 w-32 bg-muted" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-2.5 w-16 bg-muted" />
                    <div className="h-2.5 w-20 bg-muted" />
                    <div className="h-2.5 w-14 bg-muted" />
                </div>
            </div>
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border border-border p-4 sm:p-5 min-h-[96px]">
                    <div className="h-2.5 w-24 bg-muted mb-3" />
                    <div className="flex items-end justify-between">
                        <div className="h-7 w-16 bg-muted" />
                        <div className="h-2.5 w-10 bg-muted" />
                    </div>
                </div>
            ))}
        </div>

        {/* Activity feed skeleton */}
        <div className="border border-border p-4 sm:p-5">
            <div className="h-2.5 w-24 bg-muted mb-3" />
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 py-3.5 border-b border-border last:border-0">
                    <div className="w-5 h-3 bg-muted" />
                    <div className="flex-1">
                        <div className="h-3 w-full max-w-md bg-muted mb-1.5" />
                        <div className="h-2.5 w-14 bg-muted" />
                    </div>
                </div>
            ))}
        </div>

        <span className="sr-only">STREAMING ANALYTICS :3003</span>
    </div>
));

AnalyticsSkeleton.displayName = "AnalyticsSkeleton";

export default AnalyticsSkeleton;
