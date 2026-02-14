import { memo } from "react";

const CartSkeleton = memo(() => (
  <div
    role="status"
    className="w-full max-w-5xl mx-auto animate-pulse"
  >
    {/* Header Skeleton */}
    <div className="mb-12">
      <div className="h-3 w-12 bg-elevated mb-4" />
      <div className="h-10 w-56 bg-elevated mb-3" />
      <div className="h-4 w-64 bg-muted" />
    </div>

    <div className="flex flex-col lg:flex-row gap-10 items-start">
      {/* Cart Items Skeleton */}
      <div className="flex-1 w-full">
        {/* Column headers */}
        <div className="flex items-center gap-4 pb-3 border-b border-edge mb-0">
          <div className="h-2.5 w-16 bg-muted" />
          <div className="flex-1" />
          <div className="h-2.5 w-12 bg-muted" />
          <div className="h-2.5 w-12 bg-muted" />
          <div className="h-2.5 w-10 bg-muted" />
        </div>

        {[1, 2].map((index) => (
          <div
            key={index}
            className="flex items-center gap-6 py-6 border-b border-edge"
          >
            {/* Image */}
            <div className="w-16 h-16 bg-surface flex-shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/30 to-transparent animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="h-5 w-40 bg-elevated mb-2" />
              <div className="h-3 w-20 bg-muted" />
            </div>
            {/* Quantity */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-elevated" />
              <div className="w-8 h-5 bg-elevated" />
              <div className="w-8 h-8 bg-elevated" />
            </div>
            {/* Price */}
            <div className="h-5 w-24 bg-elevated" />
            {/* Remove */}
            <div className="w-8 h-8 bg-muted" />
          </div>
        ))}
      </div>

      {/* Summary Skeleton */}
      <div className="lg:sticky lg:top-8 w-full lg:w-80">
        <div className="border border-edge p-6">
          <div className="h-3 w-28 bg-elevated mb-6" />

          <div className="space-y-3 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-3 w-16 bg-muted" />
                <div className="h-3 w-14 bg-muted" />
              </div>
            ))}
            <div className="border-t border-edge pt-3 flex justify-between">
              <div className="h-5 w-12 bg-elevated" />
              <div className="h-5 w-20 bg-elevated" />
            </div>
          </div>

          <div className="h-11 bg-elevated w-full" />
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
          STREAMING CART :3002
        </span>
      </div>
    </div>
    <span className="sr-only">Loading cart...</span>
  </div>
));

CartSkeleton.displayName = "CartSkeleton";

export default CartSkeleton;
