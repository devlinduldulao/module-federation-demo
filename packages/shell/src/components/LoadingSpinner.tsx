import { memo } from "react";

interface LoadingSpinnerProps {
  readonly label?: string;
  readonly size?: "sm" | "md" | "lg";
}

const LoadingSpinner = memo<LoadingSpinnerProps>(
  ({ label = "Loading...", size = "md" }) => {
    const dotSize = {
      sm: "w-1 h-1",
      md: "w-1.5 h-1.5",
      lg: "w-2 h-2",
    } as const;

    return (
      <div className="py-12 text-center" role="status" aria-live="polite">
        <div className="flex items-center justify-center gap-2 mb-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`${dotSize[size]} rounded-full bg-citrine`}
              style={{
                animation: `subtlePulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        <p className="font-mono text-[11px] tracking-wider text-dim uppercase" aria-label={label}>
          {label}
        </p>
      </div>
    );
  }
);

LoadingSpinner.displayName = "LoadingSpinner";

export default LoadingSpinner;
