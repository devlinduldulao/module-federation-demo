import { memo } from "react";

const HomeSkeleton = memo(() => (
    <div
        role="status"
        className="w-full max-w-7xl mx-auto animate-pulse"
    >
        {/* Hero Header Skeleton */}
        <div className="mb-10 lg:mb-14">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                    <div className="h-2.5 w-36 bg-muted mb-2 rounded-md" />
                    <div className="h-7 w-72 bg-muted mb-2 rounded-md" />
                    <div className="h-2.5 w-32 bg-muted mb-3 rounded-md" />
                    <div className="h-3 w-full max-w-xl bg-muted mb-1 rounded-md" />
                    <div className="h-3 w-3/4 bg-muted rounded-md" />
                </div>
            </div>
        </div>

        {/* Architecture Stats Skeleton */}
        <div className="mb-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="bg-background p-4 sm:p-5 min-h-[88px]">
                        <div className="h-2.5 w-14 bg-muted mb-2 rounded-md" />
                        <div className="h-4 w-28 bg-muted rounded-md" />
                    </div>
                ))}
            </div>
        </div>

        {/* Section Header Skeleton */}
        <div className="flex items-center justify-between mb-5">
            <div>
                <div className="h-2.5 w-24 bg-muted mb-2 rounded-md" />
                <div className="h-5 w-48 bg-muted rounded-md" />
            </div>
            <div className="h-2.5 w-24 bg-muted hidden sm:block rounded-md" />
        </div>

        {/* Destination Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-border p-px">
                    <div className="bg-background">
                        {/* Icon area */}
                        <div className="aspect-[16/9] min-h-[120px] max-h-[140px] bg-card relative overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-muted/30 to-transparent animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
                        </div>
                        {/* Content */}
                        <div className="p-5 sm:p-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="h-5 w-24 bg-muted rounded-md" />
                                <div className="h-2.5 w-10 bg-muted rounded-md" />
                            </div>
                            <div className="h-3 w-full bg-muted mb-1 rounded-md" />
                            <div className="h-3 w-4/5 bg-muted mb-5 rounded-md" />
                            <div className="h-8 w-full bg-muted rounded-md" />
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Footer Note Skeleton */}
        <div className="mt-10 pt-6 border-t border-border">
            <div className="text-center max-w-2xl mx-auto">
                <div className="h-2.5 w-20 bg-muted mx-auto mb-3 rounded-md" />
                <div className="h-3 w-full bg-muted mb-1 rounded-md" />
                <div className="h-3 w-3/4 bg-muted mx-auto mb-4 rounded-md" />
                <div className="flex flex-wrap justify-center gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-2.5 w-24 bg-muted rounded-md" />
                    ))}
                </div>
            </div>
        </div>

        {/* Loading indicator */}
        <div className="mt-12 pt-6 border-t border-border">
            <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-primary/40"
                            style={{ animation: `subtlePulse 1.4s ease-in-out ${i * 0.2}s infinite` }}
                        />
                    ))}
                </div>
                <span className="font-mono text-[11px] text-muted-foreground/70 tracking-wider">
                    LOADING HOME :3004
                </span>
            </div>
        </div>
        <span className="sr-only">Loading home...</span>
    </div>
));

HomeSkeleton.displayName = "HomeSkeleton";

export default HomeSkeleton;
