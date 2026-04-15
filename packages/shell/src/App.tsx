import React, {
  Suspense,
  lazy,
  useState,
  useCallback,
  memo,
  useEffect,
} from "react";
import { cn } from "./lib/utils";
import {
  DEFAULT_THEME,
  THEME_DEFINITIONS,
  THEME_STORAGE_KEY,
  applyTheme,
  getInitialTheme,
  type ThemeName,
} from "./lib/theme";
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
    import React, {
      Suspense,
      lazy,
      memo,
      useCallback,
      useEffect,
      useMemo,
      useRef,
      useState,
    } from "react";
    import {
      BrowserRouter,
      NavLink,
      Navigate,
      Route,
      Routes,
      useLocation,
    } from "react-router-dom";
    import { cn } from "./lib/utils";
    import ErrorBoundary from "./components/ErrorBoundary";
    import ModuleFallback from "./components/ModuleFallback";
    import ProductsSkeleton from "./components/ProductsSkeleton";
    import CartSkeleton from "./components/CartSkeleton";
    import DashboardSkeleton from "./components/DashboardSkeleton";

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

    type ModuleType = "products" | "cart" | "dashboard";

    interface ModuleConfig {
      readonly id: ModuleType;
      readonly label: string;
      readonly path: string;
      readonly port: string;
      readonly component: React.LazyExoticComponent<React.ComponentType>;
    }

    const PREFETCH_MAP: Record<ModuleType, () => Promise<unknown>> = {
      products: () => import("products/StreamingProductsCatalog").catch(() => { }),
      cart: () => import("cart/StreamingShoppingCart").catch(() => { }),
      dashboard: () => import("dashboard/StreamingUserDashboard").catch(() => { }),
    };

    const MODULES: readonly ModuleConfig[] = [
      {
        id: "products",
        label: "Products",
        path: "/products",
        port: "3001",
        component: StreamingProductsCatalog,
      },
      {
        id: "cart",
        label: "Cart",
        path: "/cart",
        port: "3002",
        component: StreamingShoppingCart,
      },
      {
        id: "dashboard",
        label: "Dashboard",
        path: "/dashboard",
        port: "3003",
        component: StreamingUserDashboard,
      },
    ] as const;

    const MODULE_BY_PATH = new Map(MODULES.map((module) => [module.path, module]));

    function getModuleForPath(pathname: string): ModuleConfig {
      return MODULE_BY_PATH.get(pathname) ?? MODULES[0];
    }

    const NavigationButton = memo<{ module: ModuleConfig }>(({ module }) => {
      const handleMouseEnter = useCallback(() => {
        PREFETCH_MAP[module.id]();
      }, [module.id]);

      return (
        <NavLink
          to={module.path}
          onMouseEnter={handleMouseEnter}
          className={({ isActive }) =>
            cn(
              "relative px-5 py-2.5 font-mono text-sm tracking-wide transition-all duration-500 focus:outline-hidden",
              isActive ? "text-citrine" : "text-stone hover:text-cream"
            )
          }
          aria-label={`Navigate to ${module.label}`}
        >
          {({ isActive }) => (
            <>
              <span className="relative z-10">{module.label.toUpperCase()}</span>
              <span
                className={cn(
                  "absolute bottom-0 left-0 h-[2px] bg-citrine transition-all duration-500",
                  isActive ? "w-full" : "w-0"
                )}
              />
            </>
          )}
        </NavLink>
      );
    });

    NavigationButton.displayName = "NavigationButton";

    interface Notification {
      id: string;
      type: "success" | "error" | "info";
      message: string;
    }

    function ModuleRenderer({ module }: { module: ModuleConfig }): React.JSX.Element {
      const Component = module.component;

      const skeleton = useMemo(() => {
        switch (module.id) {
          case "products":
            return <ProductsSkeleton />;
          case "cart":
            return <CartSkeleton />;
          case "dashboard":
            return <DashboardSkeleton />;
          default:
            return <ProductsSkeleton />;
        }
      }, [module.id]);

      return (
        <ErrorBoundary>
          <Suspense fallback={skeleton} key={module.id}>
            <Component />
          </Suspense>
        </ErrorBoundary>
      );
    }

    function ShellLayout(): React.JSX.Element {
      const location = useLocation();
      const [notifications, setNotifications] = useState<Notification[]>([]);
      const hasMountedRef = useRef(false);

      const activeConfig = useMemo(
        () => getModuleForPath(location.pathname),
        [location.pathname]
      );

      const dispatchModuleChange = useCallback((moduleId: ModuleType) => {
        try {
          window.dispatchEvent(
            new CustomEvent("moduleChange", {
              detail: { newModule: moduleId },
            })
          );
        } catch (error) {
          console.warn("Failed to dispatch module change event:", error);
        }
      }, []);

      useEffect(() => {
        dispatchModuleChange(activeConfig.id);

        if (!hasMountedRef.current) {
          hasMountedRef.current = true;
          return;
        }

        setNotifications((prev) => [
          {
            id: Date.now().toString(),
            type: "info",
            message: `${activeConfig.label} module loaded`,
          },
          ...prev.slice(0, 2),
        ]);
      }, [activeConfig, dispatchModuleChange]);

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

      useEffect(() => {
        if (notifications.length === 0) {
          return;
        }

        const timer = setTimeout(() => {
          setNotifications((prev) => prev.slice(0, -1));
        }, 3000);

        return () => clearTimeout(timer);
      }, [notifications]);

      return (
        <div className="min-h-screen bg-noir relative">
          <div
            className="fixed inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(250,250,249,0.5) 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="fixed top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-citrine/40 to-transparent z-50" />

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
                  notification.type === "info" && "bg-noir border-edge text-stone"
                )}
              >
                {notification.message}
              </div>
            ))}
          </div>

          <div className="relative z-10 min-h-screen flex flex-col">
            <header className="border-b border-edge">
              <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl italic text-cream tracking-tight">
                      MF
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.3em] text-dim uppercase">
                      Demo
                    </span>
                  </div>

                  <nav
                    className="flex items-center gap-1"
                    role="navigation"
                    aria-label="Module navigation"
                  >
                    {MODULES.map((module) => (
                      <NavigationButton key={module.id} module={module} />
                    ))}
                  </nav>
                </div>
              </div>
            </header>

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

            <main className="flex-1">
              <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
                <Routes>
                  <Route path="/" element={<Navigate to={MODULES[0].path} replace />} />
                  {MODULES.map((module) => (
                    <Route
                      key={module.id}
                      path={module.path}
                      element={<ModuleRenderer module={module} />}
                    />
                  ))}
                  <Route path="*" element={<Navigate to={MODULES[0].path} replace />} />
                </Routes>
              </div>
            </main>

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

    ShellLayout.displayName = "ShellLayout";

    function App(): React.JSX.Element {
      return (
        <BrowserRouter>
          <ShellLayout />
        </BrowserRouter>
      );
    }

    App.displayName = "App";

    export default App;
                <span className="text-edge">|</span>
                <span>{activeConfig.label.toLowerCase()}</span>
                <span className="text-edge">|</span>
                <span>:{activeConfig.port}</span>
              </div >
  <div className="font-mono text-[11px] text-dim flex items-center gap-4">
    <span>React 19</span>
    <span className="text-edge">|</span>
    <span className="hidden sm:inline">Suspense</span>
    <span className="text-edge">|</span>
    <span className="hidden sm:inline">Module Federation</span>
    <span className="text-edge">|</span>
    <span>{activeTheme.label}</span>
  </div>
            </div >
          </div >
        </div >

  {/* Main content */ }
  < main className = "flex-1" >
    <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
      {renderModuleContent()}
    </div>
        </main >

  {/* Footer */ }
  < footer className = "border-t border-edge mt-auto" >
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
        </footer >
      </div >
    </div >
  );
}

App.displayName = "App";

export default App;
