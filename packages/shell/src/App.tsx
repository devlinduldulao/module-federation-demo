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
  readonly port: string;
  readonly component: React.LazyExoticComponent<React.ComponentType>;
}

// Configuration
const MODULES: readonly ModuleConfig[] = [
  { id: "products", label: "Products", port: "3001", component: StreamingProductsCatalog },
  { id: "cart", label: "Cart", port: "3002", component: StreamingShoppingCart },
  { id: "dashboard", label: "Dashboard", port: "3003", component: StreamingUserDashboard },
] as const;

// Memoized navigation button — clean editorial style
const NavigationButton = memo<{
  module: ModuleConfig;
  isActive: boolean;
  onClick: (moduleId: ModuleType) => void;
}>(({ module, isActive, onClick }) => {
  const handleMouseEnter = useCallback(() => {
    if (!isActive) {
      try {
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
        ).catch(() => {});
      } catch {}
    }
  }, [module.id, isActive]);

  return (
    <button
      onClick={() => onClick(module.id)}
      onMouseEnter={handleMouseEnter}
      className={cn(
        "relative px-5 py-2.5 font-mono text-sm tracking-wide transition-all duration-500 focus:outline-hidden",
        isActive
          ? "text-citrine"
          : "text-stone hover:text-cream"
      )}
      aria-pressed={isActive}
      aria-label={`Switch to ${module.label}`}
    >
      <span className="relative z-10">{module.label.toUpperCase()}</span>
      {/* Citrine underline indicator */}
      <span
        className={cn(
          "absolute bottom-0 left-0 h-[2px] bg-citrine transition-all duration-500",
          isActive ? "w-full" : "w-0"
        )}
      />
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

  const activeConfig = MODULES.find((m) => m.id === activeModule)!;

  const handleModuleChange = useCallback((moduleId: ModuleType) => {
    setActiveModule(moduleId);

    try {
      window.dispatchEvent(
        new CustomEvent("moduleChange", {
          detail: { newModule: moduleId },
        })
      );
    } catch (error) {
      console.warn("Failed to dispatch module change event:", error);
    }

    setNotifications((prev) => [
      {
        id: Date.now().toString(),
        type: "info",
        message: `${moduleId.charAt(0).toUpperCase() + moduleId.slice(1)} module loaded`,
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
        { id: Date.now().toString(), type, message },
        ...prev.slice(0, 2),
      ]);
    };

    window.addEventListener("showNotification", handleNotification);
    return () =>
      window.removeEventListener("showNotification", handleNotification);
  }, []);

  // Auto-remove notifications
  useEffect(() => {
    if (notifications.length === 0) return;
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
          <p className="text-stone">Module not found</p>
        </div>
      );
    }

    const { component: Component } = activeModuleConfig;

    const getSkeleton = () => {
      switch (activeModule) {
        case "products":
          return <ProductsSkeleton />;
        case "cart":
          return <CartSkeleton />;
        case "dashboard":
          return <DashboardSkeleton />;
        default:
          return <ProductsSkeleton />;
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
    <div className="min-h-screen bg-noir relative">
      {/* Subtle dot grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(250,250,249,0.5) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Top accent line */}
      <div className="fixed top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-citrine/40 to-transparent z-50" />

      {/* Notifications — minimal toast */}
      <div className="fixed top-6 right-6 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "px-4 py-2.5 border font-mono text-xs tracking-wide transition-all duration-300 animate-in slide-in-from-right",
              notification.type === "success" &&
                "bg-noir border-mint/30 text-mint",
              notification.type === "error" &&
                "bg-noir border-rose/30 text-rose",
              notification.type === "info" &&
                "bg-noir border-edge text-stone"
            )}
          >
            {notification.message}
          </div>
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header — editorial nav */}
        <header className="border-b border-edge">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl italic text-cream tracking-tight">MF</span>
                <span className="font-mono text-[10px] tracking-[0.3em] text-dim uppercase">Demo</span>
              </div>

              {/* Navigation */}
              <nav className="flex items-center gap-1" role="navigation" aria-label="Module navigation">
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
          </div>
        </header>

        {/* Module status strip */}
        <div className="border-b border-edge bg-surface/50">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
            <div className="flex items-center justify-between h-9">
              <div className="flex items-center gap-4 font-mono text-[11px] text-dim">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-citrine animate-subtle-pulse" />
                  <span>STREAMING</span>
                </div>
                <span className="text-edge">|</span>
                <span>{activeConfig.label.toLowerCase()}</span>
                <span className="text-edge">|</span>
                <span>:{activeConfig.port}</span>
              </div>
              <div className="font-mono text-[11px] text-dim hidden sm:flex items-center gap-4">
                <span>React 19</span>
                <span className="text-edge">|</span>
                <span>Suspense</span>
                <span className="text-edge">|</span>
                <span>Module Federation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
            {renderModuleContent()}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-edge mt-auto">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
            <div className="flex items-center justify-between h-12 font-mono text-[10px] tracking-wider text-dim uppercase">
              <span>Independent Deployment</span>
              <div className="flex items-center gap-4">
                <span>Hot Reload</span>
                <span className="text-edge-bright">/</span>
                <span>Zero Coupling</span>
                <span className="text-edge-bright">/</span>
                <span>Fault Isolation</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

App.displayName = "App";

export default App;
