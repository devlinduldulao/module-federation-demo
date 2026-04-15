import { memo } from "react";

const PrescriptionsSkeleton = memo(() => (
    <div role="status" className="w-full mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-12 lg:mb-20 border-b border-edge pb-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                    <div className="h-3 w-28 bg-muted mb-4" />
                    <div className="h-12 w-56 bg-elevated mb-4" />
                    <div className="h-4 w-64 bg-muted" />
                </div>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
            {/* Prescriptions list skeleton */}
            <div className="flex-1 w-full">
                <div className="hidden sm:flex items-center gap-4 pb-3 border-b border-edge mb-2">
                    <div className="w-16 shrink-0" />
                    <div className="flex-1 h-2.5 w-16 bg-muted" />
                    <div className="w-26.5 h-2.5 bg-muted" />
                    <div className="w-28 h-2.5 bg-muted" />
                    <div className="w-4" />
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 py-5 border-b border-edge">
                        <div className="w-16 h-16 bg-elevated shrink-0" />
                        <div className="flex-1">
                            <div className="h-5 w-36 bg-elevated mb-2" />
                            <div className="h-3 w-24 bg-muted" />
                        </div>
                        <div className="flex items-center border border-edge">
                            <div className="w-9 h-9 bg-surface" />
                            <div className="w-10 h-9 bg-surface border-x border-edge" />
                            <div className="w-9 h-9 bg-surface" />
                        </div>
                        <div className="w-28 h-5 bg-elevated" />
                        <div className="w-4 h-4 bg-muted" />
                    </div>
                ))}
            </div>

            {/* Summary sidebar skeleton */}
            <div className="w-full lg:w-80">
                <div className="border border-edge p-8">
                    <div className="h-3 w-36 bg-muted mb-8" />
                    <div className="space-y-4 mb-8">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex justify-between">
                                <div className="h-4 w-20 bg-muted" />
                                <div className="h-4 w-12 bg-elevated" />
                            </div>
                        ))}
                    </div>
                    <div className="h-12 w-full bg-elevated" />
                </div>
            </div>
        </div>

        <span className="sr-only">STREAMING PRESCRIPTIONS :3002</span>
    </div>
));

PrescriptionsSkeleton.displayName = "PrescriptionsSkeleton";

export default PrescriptionsSkeleton;
