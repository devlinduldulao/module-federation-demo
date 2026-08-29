import { memo } from "react";

interface ModuleFallbackProps {
  readonly icon?: string;
  readonly title: string;
  readonly message: string;
  readonly onRetry?: () => void;
}

const ModuleFallback = memo<ModuleFallbackProps>(
  ({ title, message, onRetry }) => (
    <div className="py-12 text-center max-w-lg mx-auto">
      <div className="w-10 h-10 border border-border mx-auto mb-4 flex items-center justify-center">
        <span className="font-mono text-[10px] text-muted-foreground/70">OFF</span>
      </div>
      <h3 className="font-sans font-semibold text-lg text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed mb-5">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-transparent border border-primary text-primary font-mono text-[11px] tracking-wider uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-300 focus:outline-hidden"
          aria-label="Retry loading module"
        >
          Retry Connection
        </button>
      )}
    </div>
  )
);

ModuleFallback.displayName = "ModuleFallback";

export default ModuleFallback;
