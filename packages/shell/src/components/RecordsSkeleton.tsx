import { memo } from "react";

const RecordsSkeleton = memo(() => (
    <div role="status" className="w-full mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-8 lg:mb-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                    <div className="h-2.5 w-24 bg-muted mb-2 rounded-md" />
                    <div className="h-7 w-40 bg-muted mb-2 rounded-md" />
                    <div className="h-3 w-full max-w-md bg-muted rounded-md" />
                </div>
            </div>
        </div>

        {/* Filter buttons skeleton */}
        <div className="flex items-center gap-3 mb-6 border-b border-border pb-3">
            <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-6 w-20 bg-muted rounded-md" />
                ))}
            </div>
            <div className="ml-auto h-2.5 w-16 bg-muted rounded-md" />
        </div>

        {/* Records grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="border border-border">
                    <div className="aspect-3/1 bg-muted" />
                    <div className="p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-2">
                            <div className="h-2.5 w-16 bg-muted rounded-md" />
                            <div className="h-2.5 w-12 bg-muted rounded-md" />
                        </div>
                        <div className="h-4 w-28 bg-muted mb-2 rounded-md" />
                        <div className="h-3 w-full bg-muted mb-1 rounded-md" />
                        <div className="h-3 w-3/4 bg-muted mb-4 rounded-md" />
                        <div className="h-7 w-full bg-muted rounded-md" />
                    </div>
                </div>
            ))}
        </div>

        <span className="sr-only">LOADING RECORDS :3001</span>
    </div>
));

RecordsSkeleton.displayName = "RecordsSkeleton";

export default RecordsSkeleton;
