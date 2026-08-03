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
      <div className="w-10 h-10 border border-edge mx-auto mb-4 flex items-center justify-center">
        <span className="font-mono text-[10px] text-dim">OFF</span>
      </div>
      <h3 className="font-display text-lg italic text-cream mb-2">{title}</h3>
      <p className="text-stone text-sm leading-relaxed mb-5">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-transparent border border-citrine text-citrine font-mono text-[11px] tracking-wider uppercase hover:bg-citrine hover:text-ink transition-all duration-300 focus:outline-hidden"
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
