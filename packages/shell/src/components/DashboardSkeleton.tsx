import { memo } from "react";

const DashboardSkeleton = memo(() => (
  <div
    role="status"
    className="w-full max-w-7xl mx-auto px-8 py-12 animate-pulse"
  >
    {/* Header Skeleton */}
    <div className="mb-16 text-center">
      <div className="inline-block w-20 h-20 bg-gray-200 rounded-3xl mb-8" />
      <div className="h-10 bg-gray-200 rounded-lg w-80 mx-auto mb-6" />
      <div className="h-6 bg-gray-200 rounded-lg w-[600px] max-w-full mx-auto" />
    </div>

    {/* Welcome Card Skeleton */}
    <div className="mb-16">
      <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <div className="h-8 bg-gray-200 rounded-lg w-80 mb-4" />
            <div className="h-6 bg-gray-200 rounded-lg w-96 mb-6" />
            <div className="flex items-center gap-6">
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="h-4 bg-gray-200 rounded w-40" />
              <div className="h-4 bg-gray-200 rounded w-36" />
            </div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="h-4 bg-gray-200 rounded w-20 mx-auto mb-2" />
            <div className="h-8 bg-gray-200 rounded w-24 mx-auto" />
          </div>
        </div>
      </div>
    </div>

    {/* Stats Section */}
    <div className="mb-16">
      <div className="mb-10">
        <div className="h-8 bg-gray-200 rounded-lg w-64 mb-4" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm"
          >
            <div className="text-center">
              <div className="inline-block w-16 h-16 bg-gray-200 rounded-2xl mb-8" />
              <div className="h-10 bg-gray-200 rounded-lg mb-4" />
              <div className="h-5 bg-gray-200 rounded-lg mb-6" />
              <div className="h-6 w-32 bg-gray-200 rounded-full mx-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Activity Section Skeleton */}
    <div className="mb-10">
      <div className="bg-white rounded-2xl border border-slate-200 p-10 shadow-sm">
        <div className="mb-10">
          <div className="h-8 bg-gray-200 rounded-lg w-64 mb-4" />
          <div className="h-5 bg-gray-200 rounded-lg w-[500px] max-w-full" />
        </div>
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex items-start gap-6 p-6 bg-slate-50 rounded-xl"
            >
              <div className="flex items-center gap-4 flex-shrink-0 mt-1">
                <div className="w-3 h-3 bg-gray-200 rounded-full" />
                <div className="w-8 h-8 bg-gray-200 rounded" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-5 bg-gray-200 rounded-lg mb-3 w-full" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Footer Skeleton */}
    <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm mb-10">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-6" />
        <div className="h-6 bg-gray-200 rounded-lg w-80 mx-auto mb-4" />
        <div className="h-5 bg-gray-200 rounded-lg w-[500px] max-w-full mx-auto mb-8" />
        <div className="flex flex-wrap justify-center gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-32" />
          ))}
        </div>
      </div>
    </div>

    {/* Streaming indicator */}
    <div className="text-center mt-16">
      <div className="inline-flex items-center gap-4 px-8 py-4 bg-purple-50 border border-purple-200 rounded-full">
        <div className="flex gap-2">
          <div
            className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
        <span className="text-purple-700 font-semibold">
          Streaming Dashboard (Port 3003)
        </span>
      </div>
    </div>
    <span className="sr-only">Loading dashboard...</span>
  </div>
));

DashboardSkeleton.displayName = "DashboardSkeleton";

export default DashboardSkeleton;
