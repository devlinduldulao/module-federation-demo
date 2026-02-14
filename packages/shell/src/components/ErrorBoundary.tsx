import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Module Federation Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="py-20 text-center max-w-lg mx-auto">
            <div className="font-mono text-[11px] tracking-[0.3em] text-rose uppercase mb-6">ERROR</div>
            <h2 className="font-display text-3xl italic text-cream mb-4">
              Something went wrong
            </h2>
            <p className="text-stone text-sm mb-8 leading-relaxed">
              There was an error loading this module. The remote service may be unavailable.
            </p>
            <button
              onClick={() =>
                this.setState({ hasError: false, error: undefined })
              }
              className="px-6 py-2.5 bg-transparent border border-citrine text-citrine font-mono text-xs tracking-wider uppercase hover:bg-citrine hover:text-noir transition-all duration-300 focus:outline-hidden"
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
