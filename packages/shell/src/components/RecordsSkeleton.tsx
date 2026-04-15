import { memo } from "react";

const RecordsSkeleton = memo(() => (
    <div role="status" className="w-full mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-12 lg:mb-20 border-b border-edge pb-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                    <div className="h-3 w-24 bg-muted mb-4" />
                    <div className="h-12 w-48 bg-elevated mb-4" />
                    <div className="h-4 w-full max-w-md bg-muted" />
                </div>
            </div>
        </div>

        {/* Filter buttons skeleton */}
        <div className="flex items-center gap-4 mb-8">
            <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-9 w-24 bg-elevated" />
                ))}
            </div>
            <div className="ml-auto h-3 w-20 bg-muted" />
        </div>

        {/* Records grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="border border-edge p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-3 w-20 bg-muted" />
                        <div className="h-5 w-16 bg-elevated" />
                    </div>
                    <div className="h-5 w-36 bg-elevated mb-2" />
                    <div className="h-3 w-28 bg-muted mb-4" />
                    <div className="h-4 w-full bg-muted mb-1" />
                    <div className="h-4 w-3/4 bg-muted mb-6" />
                    <div className="h-9 w-full bg-elevated" />
                </div>
            ))}
        </div>

        <span className="sr-only">LOADING RECORDS :3001</span>
    </div>
));

RecordsSkeleton.displayName = "RecordsSkeleton";

export default RecordsSkeleton;
