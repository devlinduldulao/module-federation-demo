import { memo } from "react";

interface ModuleFallbackProps {
  readonly icon?: string;
  readonly title: string;
  readonly message: string;
  readonly onRetry?: () => void;
}

const ModuleFallback = memo<ModuleFallbackProps>(
  ({ icon, title, message, onRetry }) => (
    <div className="p-8 text-center max-w-md mx-auto">
      {icon && (
        <div className="text-6xl mb-4" role="img" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold mb-2 text-gray-800">{title}</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-purple-600 text-gray-200 rounded-lg hover:bg-purple-700 transition-colors focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          aria-label="Retry loading module"
        >
          Try Again
        </button>
      )}
    </div>
  )
);

ModuleFallback.displayName = "ModuleFallback";

export default ModuleFallback;
