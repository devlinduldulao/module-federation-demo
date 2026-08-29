import { memo } from "react";

const PrescriptionsSkeleton = memo(() => (
    <div role="status" className="w-full mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-8 lg:mb-10 border-b border-border pb-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                    <div className="h-2.5 w-24 bg-muted mb-2 rounded-md" />
                    <div className="h-7 w-48 bg-muted mb-2 rounded-md" />
                    <div className="h-3 w-56 bg-muted rounded-md" />
                </div>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
            {/* Prescriptions list skeleton */}
            <div className="flex-1 w-full">
                <div className="hidden sm:flex items-center gap-3 pb-2 border-b border-border mb-1">
                    <div className="w-11 shrink-0" />
                    <div className="flex-1 h-2.5 w-14 bg-muted rounded-md" />
                    <div className="w-[5.25rem] h-2.5 bg-muted rounded-md" />
                    <div className="w-24 h-2.5 bg-muted rounded-md" />
                    <div className="w-4" />
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-3.5 border-b border-border">
                        <div className="w-11 h-11 bg-muted shrink-0 rounded-md" />
                        <div className="flex-1">
                            <div className="h-4 w-28 bg-muted mb-1.5 rounded-md" />
                            <div className="h-2.5 w-20 bg-muted rounded-md" />
                        </div>
                        <div className="flex items-center border border-border">
                            <div className="w-8 h-8 bg-card" />
                            <div className="w-9 h-8 bg-card border-x border-border" />
                            <div className="w-8 h-8 bg-card" />
                        </div>
                        <div className="w-24 h-4 bg-muted rounded-md" />
                        <div className="w-3 h-3 bg-muted rounded-md" />
                    </div>
                ))}
            </div>

            {/* Summary sidebar skeleton */}
            <div className="w-full lg:w-72">
                <div className="border border-border p-5 rounded-lg">
                    <div className="h-2.5 w-32 bg-muted mb-5 rounded-md" />
                    <div className="space-y-3 mb-5">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex justify-between">
                                <div className="h-3 w-16 bg-muted rounded-md" />
                                <div className="h-3 w-10 bg-muted rounded-md" />
                            </div>
                        ))}
                    </div>
                    <div className="h-8 w-full bg-muted rounded-md" />
                </div>
            </div>
        </div>

        <span className="sr-only">STREAMING PRESCRIPTIONS :3002</span>
    </div>
));

PrescriptionsSkeleton.displayName = "PrescriptionsSkeleton";

export default PrescriptionsSkeleton;
