import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | undefined;
}

class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Module Federation Error:", error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="py-12 text-center max-w-lg mx-auto">
            <div className="font-mono text-[10px] tracking-[0.25em] text-rose uppercase mb-3">ERROR</div>
            <h2 className="font-display text-xl italic text-cream mb-2">
              Something went wrong
            </h2>
            <p className="text-stone text-sm mb-5 leading-relaxed">
              There was an error loading this module. The remote service may be unavailable.
            </p>
            <button
              onClick={() =>
                this.setState({ hasError: false, error: undefined })
              }
              className="px-4 py-2 bg-transparent border border-citrine text-citrine font-mono text-[11px] tracking-wider uppercase hover:bg-citrine hover:text-ink transition-all duration-300 focus:outline-hidden"
            >
              Retry
            </button>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="cursor-pointer font-mono text-xs text-dim hover:text-stone transition-colors">
                  Stack trace
                </summary>
                <pre className="mt-3 p-4 bg-surface border border-edge font-mono text-[11px] text-stone overflow-auto leading-relaxed">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
