import { memo } from "react";

const CartSkeleton = memo(() => (
  <div
    role="status"
    className="w-full max-w-5xl mx-auto px-8 py-12 animate-pulse"
  >
    {/* Header Skeleton */}
    <div className="mb-16 text-center">
      <div className="inline-block w-20 h-20 bg-gray-200 rounded-3xl mb-8" />
      <div className="h-10 bg-gray-200 rounded-lg w-72 mx-auto mb-6" />
      <div className="h-6 bg-gray-200 rounded-lg w-80 mx-auto" />
    </div>

    <div className="flex flex-col lg:flex-row gap-12 items-start">
      {/* Cart Items Skeleton */}
      <div className="flex-1 space-y-8">
        {[1, 2].map((index) => (
          <div
            key={index}
            className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6 flex-1">
                {/* Product Image Skeleton */}
                <div className="w-20 h-20 bg-gray-200 rounded-2xl" />
                <div className="text-center sm:text-left">
                  <div className="h-6 bg-gray-200 rounded-lg w-40 mb-3" />
                  <div className="h-5 bg-gray-200 rounded-lg w-24 mb-2" />
                  <div className="h-4 bg-gray-200 rounded-lg w-32" />
                </div>
              </div>

              <div className="flex items-center gap-8">
                {/* Quantity Controls Skeleton */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                  <div className="w-16 text-center">
                    <div className="h-6 bg-gray-200 rounded w-8 mx-auto mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-6 mx-auto" />
                  </div>
                  <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                </div>

                {/* Price Skeleton */}
                <div className="text-center">
                  <div className="h-8 w-24 bg-gray-200 rounded-lg mb-2" />
                  <div className="h-3 w-20 bg-gray-200 rounded mx-auto" />
                </div>

                {/* Remove Button Skeleton */}
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary Skeleton */}
      <div className="lg:sticky lg:top-8">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-10 shadow-sm">
          <div className="text-center mb-8">
            <div className="inline-block w-16 h-16 bg-gray-200 rounded-2xl mb-6" />
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-4" />
            <div className="h-10 bg-gray-200 rounded-lg w-24 mx-auto mb-4" />
            <div className="h-3 bg-gray-200 rounded w-36 mx-auto" />
          </div>

          <div className="space-y-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
            ))}
            <hr className="border-slate-200 my-4" />
            <div className="flex justify-between">
              <div className="h-5 bg-gray-200 rounded w-16" />
              <div className="h-5 bg-gray-200 rounded w-20" />
            </div>
          </div>

          <div className="h-16 bg-gray-200 rounded-xl mb-6" />
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto" />
        </div>
      </div>
    </div>

    {/* Streaming indicator */}
    <div className="text-center mt-16">
      <div className="inline-flex items-center gap-4 px-8 py-4 bg-green-50 border border-green-200 rounded-full">
        <div className="flex gap-2">
          <div
            className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
        <span className="text-green-700 font-semibold">
          Streaming Cart (Port 3002)
        </span>
      </div>
    </div>
    <span className="sr-only">Loading cart...</span>
  </div>
));

CartSkeleton.displayName = "CartSkeleton";

export default CartSkeleton;
