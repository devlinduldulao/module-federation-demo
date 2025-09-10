import React, { memo } from "react";

interface LoadingSpinnerProps {
  readonly label?: string;
  readonly size?: "sm" | "md" | "lg";
}

const LoadingSpinner = memo<LoadingSpinnerProps>(
  ({ label = "Loading...", size = "md" }) => {
    const sizeClasses = {
      sm: "text-2xl",
      md: "text-4xl",
      lg: "text-6xl",
    } as const;

    return (
      <div className="p-8 text-center" role="status" aria-live="polite">
        <div
          className={`animate-spin mb-4 ${sizeClasses[size]}`}
          aria-hidden="true"
        >
          ⚡
        </div>
        <p className="text-lg text-gray-600" aria-label={label}>
          {label}
        </p>
      </div>
    );
  }
);

LoadingSpinner.displayName = "LoadingSpinner";

export default LoadingSpinner;
