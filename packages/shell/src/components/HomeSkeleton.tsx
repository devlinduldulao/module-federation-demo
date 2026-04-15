import { memo } from "react";

const HomeSkeleton = memo(() => (
    <div
        role="status"
        className="w-full max-w-7xl mx-auto animate-pulse"
    >
        {/* Hero Header Skeleton */}
        <div className="mb-16 lg:mb-24">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                    <div className="h-3 w-40 bg-elevated mb-4" />
                    <div className="h-12 w-80 bg-elevated mb-4" />
                    <div className="h-4 w-full max-w-xl bg-muted mb-1" />
                    <div className="h-4 w-3/4 bg-muted" />
                </div>
            </div>
        </div>

        {/* Architecture Stats Skeleton */}
        <div className="mb-16">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-edge">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="bg-noir p-6">
                        <div className="h-2.5 w-16 bg-muted mb-3" />
                        <div className="h-6 w-32 bg-elevated" />
                    </div>
                ))}
            </div>
        </div>

        {/* Section Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
            <div>
                <div className="h-3 w-28 bg-muted mb-3" />
                <div className="h-8 w-64 bg-elevated" />
            </div>
            <div className="h-3 w-28 bg-muted hidden sm:block" />
        </div>

        {/* Destination Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-edge p-px">
                    <div className="bg-noir">
                        {/* Icon area */}
                        <div className="aspect-[2/1] bg-surface relative overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-muted/30 to-transparent animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
                        </div>
                        {/* Content */}
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-3">
                                <div className="h-7 w-28 bg-elevated" />
                                <div className="h-3 w-12 bg-muted" />
                            </div>
                            <div className="h-3 w-full bg-muted mb-1" />
                            <div className="h-3 w-4/5 bg-muted mb-6" />
                            <div className="h-10 w-full bg-elevated" />
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Footer Note Skeleton */}
        <div className="mt-16 pt-8 border-t border-edge">
            <div className="text-center max-w-2xl mx-auto">
                <div className="h-3 w-24 bg-muted mx-auto mb-4" />
                <div className="h-3 w-full bg-muted mb-1" />
                <div className="h-3 w-3/4 bg-muted mx-auto mb-6" />
                <div className="flex flex-wrap justify-center gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-3 w-28 bg-muted" />
                    ))}
                </div>
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
                    STREAMING HOME :3004
                </span>
            </div>
        </div>
        <span className="sr-only">Loading home...</span>
    </div>
));

HomeSkeleton.displayName = "HomeSkeleton";

export default HomeSkeleton;
