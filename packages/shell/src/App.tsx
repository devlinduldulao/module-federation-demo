import React, {
  Suspense,
  lazy,
  useState,
  useCallback,
  memo,
  useEffect,
} from "react";
import { cn } from "./lib/utils";
import ErrorBoundary from "./components/ErrorBoundary";
import ModuleFallback from "./components/ModuleFallback";
import ProductsSkeleton from "./components/ProductsSkeleton";
import CartSkeleton from "./components/CartSkeleton";
import DashboardSkeleton from "./components/DashboardSkeleton";

// Lazy load remote streaming modules with better error handling and skeleton fallbacks
const StreamingProductsCatalog = lazy(() =>
  import("products/StreamingProductsCatalog").catch((error) => {
    console.error("Failed to load StreamingProductsCatalog:", error);
    return {
      default: () => (
        <ModuleFallback
          title="Products Module Unavailable"
          message="The products service is currently unavailable."
        />
      ),
    };
  })
);

const StreamingShoppingCart = lazy(() =>
  import("cart/StreamingShoppingCart").catch((error) => {
    console.error("Failed to load StreamingShoppingCart:", error);
    return {
      default: () => (
        <ModuleFallback
          title="Cart Module Unavailable"
          message="The cart service is currently unavailable."
        />
      ),
    };
  })
);

const StreamingUserDashboard = lazy(() =>
  import("dashboard/StreamingUserDashboard").catch((error) => {
    console.error("Failed to load StreamingUserDashboard:", error);
    return {
      default: () => (
        <ModuleFallback
          title="Dashboard Module Unavailable"
          message="The dashboard service is currently unavailable."
        />
      ),
    };
  })
);

// Type definitions
type ModuleType = "products" | "cart" | "dashboard";

interface ModuleConfig {
  readonly id: ModuleType;
  readonly label: string;
  readonly component: React.LazyExoticComponent<React.ComponentType>;
}

// Configuration
const MODULES: readonly ModuleConfig[] = [
  { id: "products", label: "Products", component: StreamingProductsCatalog },
  { id: "cart", label: "Cart", component: StreamingShoppingCart },
  { id: "dashboard", label: "Dashboard", component: StreamingUserDashboard },
] as const;

// Memoized components
const NavigationButton = memo<{
  module: ModuleConfig;
  isActive: boolean;
  onClick: (moduleId: ModuleType) => void;
}>(({ module, isActive, onClick }) => {
  // Prefetch module on hover for better UX
  const handleMouseEnter = useCallback(() => {
    if (!isActive) {
      // Prefetch the module when user hovers for better perceived performance
      try {
        // This triggers the lazy loading but doesn't wait for it
        import(
          `${module.id}/Streaming${
            module.id.charAt(0).toUpperCase() + module.id.slice(1)
          }${
            module.id === "products"
              ? "Catalog"
              : module.id === "cart"
              ? "ShoppingCart"
              : "UserDashboard"
          }`
        ).catch(() => {
          // Silently fail - will show proper error when actually clicked
        });
      } catch {
        // Module might not be available for prefetch
      }
    }
  }, [module.id, isActive]);

  return (
    <button
      key={module.id}
      onClick={() => onClick(module.id)}
      onMouseEnter={handleMouseEnter}
      className={cn(
        "group relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        isActive
          ? "bg-blue-600 text-gray-200 shadow-lg scale-105"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
      )}
      aria-pressed={isActive}
      aria-label={`Switch to ${module.label}`}
    >
      <span className="flex items-center gap-2">
        <span>{module.label}</span>
        {!isActive && (
          <span className="text-xs opacity-60 hidden sm:inline">preload</span>
        )}
      </span>
      {isActive && (
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
      )}
    </button>
  );
});

NavigationButton.displayName = "NavigationButton";

// Notification system
interface Notification {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

// Main App component
function App(): JSX.Element {
  const [activeModule, setActiveModule] = useState<ModuleType>("products");
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleModuleChange = useCallback((moduleId: ModuleType) => {
    setActiveModule(moduleId);

    // Clear any module-specific caches to ensure fresh loading on next visit
    try {
      // Dispatch a custom event to signal module change to remote modules
      window.dispatchEvent(
        new CustomEvent("moduleChange", {
          detail: { newModule: moduleId },
        })
      );
    } catch (error) {
      console.warn("Failed to dispatch module change event:", error);
    }

    // Add visual feedback for module switching
    setNotifications((prev) => [
      {
        id: Date.now().toString(),
        type: "info",
        message: `Switched to ${
          moduleId.charAt(0).toUpperCase() + moduleId.slice(1)
        } module`,
      },
      ...prev.slice(0, 2),
    ]);
  }, []);

  // Global notification listener
  useEffect(() => {
    const handleNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type, message } = customEvent.detail;
      setNotifications((prev) => [
        {
          id: Date.now().toString(),
          type,
          message,
        },
        ...prev.slice(0, 2),
      ]);
    };

    window.addEventListener("showNotification", handleNotification);
    return () =>
      window.removeEventListener("showNotification", handleNotification);
  }, []);

  // Auto-remove notifications
  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications((prev) => prev.slice(0, -1));
    }, 3000);
    return () => clearTimeout(timer);
  }, [notifications]);

  const renderModuleContent = useCallback(() => {
    const activeModuleConfig = MODULES.find(
      (module) => module.id === activeModule
    );

    if (!activeModuleConfig) {
      return (
        <div className="p-8 text-center">
          <p className="text-gray-600">Module not found</p>
        </div>
      );
    }

    const { component: Component } = activeModuleConfig;

    // Choose appropriate skeleton based on module type
    const getSkeleton = () => {
      switch (activeModule) {
        case "products":
          return <ProductsSkeleton />;
        case "cart":
          return <CartSkeleton />;
        case "dashboard":
          return <DashboardSkeleton />;
        default:
          return <ProductsSkeleton />; // Default to products skeleton
      }
    };

    return (
      <ErrorBoundary>
        <Suspense fallback={getSkeleton()} key={activeModule}>
          <Component />
        </Suspense>
      </ErrorBoundary>
    );
  }, [activeModule]);

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-slate-100" />
      <div
        className="absolute inset-0 bg-grid-slate-100 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.15) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "px-4 py-3 rounded-lg border shadow-lg transform transition-all duration-300 animate-in slide-in-from-right",
              notification.type === "success" &&
                "bg-green-50 border-green-200 text-green-800",
              notification.type === "error" &&
                "bg-red-50 border-red-200 text-red-800",
              notification.type === "info" &&
                "bg-blue-50 border-blue-200 text-blue-800"
            )}
          >
            {notification.message}
          </div>
        ))}
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-start pt-8 px-4">
        <div className="w-full max-w-7xl mx-auto">
          {/* Header */}
          <header className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <h1 className="text-4xl font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-3">
                  <span>Module Federation Demo</span>
                </h1>
                <p className="text-slate-600 mt-2 text-lg font-medium">
                  React 18 Suspense & Streaming Components
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 text-sm text-slate-500">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>
                    Live Demo • Streaming • Skeleton Loading • Independent
                    Deployment
                  </span>
                </div>
              </div>
              <nav
                className="flex gap-3"
                role="navigation"
                aria-label="Module navigation"
              >
                {MODULES.map((module) => (
                  <NavigationButton
                    key={module.id}
                    module={module}
                    isActive={activeModule === module.id}
                    onClick={handleModuleChange}
                  />
                ))}
              </nav>
            </div>
          </header>

          {/* Module indicator with streaming status */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-50 border border-blue-200 rounded-full text-blue-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold">
                  Streaming:{" "}
                  {activeModule.charAt(0).toUpperCase() + activeModule.slice(1)}{" "}
                  Module
                </span>
              </div>
              <div className="h-4 w-px bg-blue-300" />
              <span className="text-xs text-blue-600 font-medium">
                Port:{" "}
                {activeModule === "products"
                  ? "3001"
                  : activeModule === "cart"
                  ? "3002"
                  : "3003"}
              </span>
            </div>
          </div>

          {/* Main content */}
          <main className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 min-h-[700px] relative overflow-hidden">
            {/* Module boundary indicator */}
            <div className="absolute top-4 right-4 px-3 py-1 bg-blue-600 text-gray-200 text-xs font-medium rounded-full">
              Micro-Frontend
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
              {renderModuleContent()}
            </div>

            {/* Clean top border */}
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" />
          </main>

          {/* Footer info */}
          <footer className="mt-8 text-center">
            <div className="inline-flex items-center gap-4 px-6 py-3 bg-white border border-slate-200 rounded-full text-slate-600 text-sm shadow-sm">
              <span>Independent Deployment</span>
              <span>•</span>
              <span>Hot Reloading</span>
              <span>•</span>
              <span>Zero Coupling</span>
              <span>•</span>
              <span>React 18 Streaming</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

App.displayName = "App";

export default App;
