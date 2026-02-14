import { memo } from "react";

const ProductsSkeleton = memo(() => (
  <div
    role="status"
    className="w-full max-w-6xl mx-auto animate-pulse"
  >
    {/* Header Skeleton */}
    <div className="mb-14">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="h-3 w-20 bg-elevated mb-4" />
          <div className="h-10 w-72 bg-elevated mb-3" />
          <div className="h-4 w-96 bg-muted" />
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="flex items-center gap-6 border-t border-b border-edge py-4">
        {["w-14", "w-24", "w-20", "w-16"].map((w, i) => (
          <div key={i} className={`h-4 ${w} bg-elevated`} />
        ))}
      </div>
    </div>

    {/* Products Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[1px] bg-edge">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="bg-noir p-6"
        >
          {/* Image placeholder */}
          <div className="aspect-square bg-surface mb-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/30 to-transparent animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
          </div>
          {/* Category */}
          <div className="h-2.5 w-16 bg-elevated mb-3" />
          {/* Name */}
          <div className="h-5 w-3/4 bg-elevated mb-2" />
          {/* Description */}
          <div className="h-3 w-full bg-muted mb-1" />
          <div className="h-3 w-2/3 bg-muted mb-5" />
          {/* Price + button */}
          <div className="flex items-center justify-between pt-4 border-t border-edge">
            <div className="h-6 w-20 bg-elevated" />
            <div className="h-8 w-24 bg-elevated" />
          </div>
        </div>
      ))}
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
          STREAMING PRODUCTS :3001
        </span>
      </div>
    </div>
    <span className="sr-only">Loading products...</span>
  </div>
));

ProductsSkeleton.displayName = "ProductsSkeleton";

export default ProductsSkeleton;
