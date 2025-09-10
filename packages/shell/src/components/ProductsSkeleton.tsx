import { memo } from "react";

const ProductsSkeleton = memo(() => (
  <div
    role="status"
    className="w-full max-w-6xl mx-auto px-8 py-12 animate-pulse"
  >
    {/* Header Skeleton */}
    <div className="mb-16 text-center">
      <div className="inline-block w-16 h-16 bg-gray-200 rounded-2xl mb-8" />
      <div className="h-10 bg-gray-200 rounded-lg w-80 mx-auto mb-6" />
      <div className="h-6 bg-gray-200 rounded-lg w-[500px] max-w-full mx-auto mb-10" />

      {/* Category filters skeleton */}
      <div className="flex flex-wrap justify-center gap-4">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="h-12 bg-gray-200 rounded-xl"
            style={{
              width:
                index === 1
                  ? "90px"
                  : index === 2
                  ? "140px"
                  : index === 3
                  ? "110px"
                  : "100px",
            }}
          />
        ))}
      </div>
    </div>

    {/* Products Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm"
        >
          {/* Product Image */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gray-200 rounded-2xl mx-auto mb-6" />
            <div className="h-6 bg-gray-200 rounded-lg mb-4" />
            <div className="h-4 bg-gray-200 rounded-lg w-3/4 mx-auto" />
          </div>

          {/* Price and Button */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <div className="flex-1">
              <div className="h-8 w-24 bg-gray-200 rounded-lg mb-2" />
              <div className="h-3 w-20 bg-gray-200 rounded" />
            </div>
            <div className="h-12 w-32 bg-gray-200 rounded-xl ml-4" />
          </div>
        </div>
      ))}
    </div>

    {/* Streaming indicator */}
    <div className="text-center mt-16">
      <div className="inline-flex items-center gap-4 px-8 py-4 bg-blue-50 border border-blue-200 rounded-full">
        <div className="flex gap-2">
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
        <span className="text-blue-700 font-semibold">
          Streaming Products (Port 3001)
        </span>
      </div>
    </div>
    <span className="sr-only">Loading products...</span>
  </div>
));

ProductsSkeleton.displayName = "ProductsSkeleton";

export default ProductsSkeleton;
