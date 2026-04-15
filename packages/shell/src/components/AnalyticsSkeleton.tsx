import { memo } from "react";

const AnalyticsSkeleton = memo(() => (
    <div role="status" className="w-full mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-12 lg:mb-20 border-b border-edge pb-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                    <div className="h-3 w-32 bg-muted mb-4" />
                    <div className="h-12 w-48 bg-elevated mb-4" />
                    <div className="h-4 w-full max-w-md bg-muted" />
                </div>
            </div>
        </div>

        {/* Welcome banner skeleton */}
        <div className="border border-edge p-8 mb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="h-3 w-24 bg-muted mb-3" />
                    <div className="h-7 w-40 bg-elevated" />
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-3 w-20 bg-muted" />
                    <div className="h-3 w-24 bg-muted" />
                    <div className="h-3 w-16 bg-muted" />
                </div>
            </div>
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border border-edge p-6">
                    <div className="h-2.5 w-28 bg-muted mb-5" />
                    <div className="flex items-end justify-between">
                        <div className="h-10 w-20 bg-elevated" />
                        <div className="h-3 w-12 bg-muted" />
                    </div>
                </div>
            ))}
        </div>

        {/* Activity feed skeleton */}
        <div className="border border-edge p-8">
            <div className="h-3 w-28 bg-muted mb-6" />
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 py-4 border-b border-edge last:border-0">
                    <div className="w-6 h-4 bg-muted" />
                    <div className="flex-1">
                        <div className="h-4 w-full max-w-md bg-muted mb-2" />
                        <div className="h-2.5 w-16 bg-muted" />
                    </div>
                </div>
            ))}
        </div>

        <span className="sr-only">STREAMING ANALYTICS :3003</span>
    </div>
));

AnalyticsSkeleton.displayName = "AnalyticsSkeleton";

export default AnalyticsSkeleton;
