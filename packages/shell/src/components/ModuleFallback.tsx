import { memo } from "react";

interface ModuleFallbackProps {
  readonly icon?: string;
  readonly title: string;
  readonly message: string;
  readonly onRetry?: () => void;
}

const ModuleFallback = memo<ModuleFallbackProps>(
  ({ title, message, onRetry }) => (
    <div className="py-20 text-center max-w-lg mx-auto">
      <div className="w-12 h-12 border border-edge mx-auto mb-8 flex items-center justify-center">
        <span className="font-mono text-[10px] text-dim">OFF</span>
      </div>
      <h3 className="font-display text-2xl italic text-cream mb-3">{title}</h3>
      <p className="text-stone text-sm leading-relaxed mb-8">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-transparent border border-citrine text-citrine font-mono text-xs tracking-wider uppercase hover:bg-citrine hover:text-noir transition-all duration-300 focus:outline-hidden"
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
