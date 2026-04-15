import React, {
  Suspense,
  lazy,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Toaster, toast } from "sonner";
import { cn } from "./lib/utils";
import {
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
type NotificationType = "success" | "error" | "info" | "warning";

type CommandAction = {
  id: string;
  title: string;
  subtitle: string;
  keywords: string;
  run: () => void;
};

type ModuleConfig = {
  id: ModuleType;
  label: string;
  path: string;
  port: string;
  component: React.LazyExoticComponent<React.ComponentType>;
};

const MODULES = [
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
] as const satisfies readonly ModuleConfig[];

const DEFAULT_MODULE = MODULES[0]!;
const ROOT_MODULE = DEFAULT_MODULE;
const MODULE_BY_PATH = new Map<string, ModuleConfig>(
  MODULES.map((module) => [module.path, module])
);
const KNOWN_PATHS = new Set<string>(MODULES.map((module) => module.path));
const THEME_OPTIONS: readonly ThemeName[] = ["dark", "dim", "light"] as const;
const KEYBOARD_SHORTCUT_LABEL = "Ctrl/Cmd + K";

const PREFETCHERS: Record<ModuleType, () => Promise<unknown>> = {
  products: () => import("products/StreamingProductsCatalog").catch(() => undefined),
  cart: () => import("cart/StreamingShoppingCart").catch(() => undefined),
  dashboard: () => import("dashboard/StreamingUserDashboard").catch(() => undefined),
};

function getModuleForPath(pathname: string): ModuleConfig {
  if (pathname === "/") {
    return ROOT_MODULE;
  }

  return MODULE_BY_PATH.get(pathname) ?? DEFAULT_MODULE;
}

function showToast(type: NotificationType, message: string): void {
  if (type === "success") {
    toast.success(message);
    return;
  }

  if (type === "error") {
    toast.error(message);
    return;
  }

  if (type === "warning") {
    toast.warning(message);
    return;
  }

  toast(message);
}

const NavigationItem = memo(function NavigationItem({
  module,
}: {
  module: ModuleConfig;
}) {
  return (
    <NavLink
      to={module.path}
      onMouseEnter={() => {
        PREFETCHERS[module.id]();
      }}
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
              "absolute bottom-0 left-0 h-0.5 bg-citrine transition-all duration-500",
              isActive ? "w-full" : "w-0"
            )}
          />
        </>
      )}
    </NavLink>
  );
});

const ThemeSelector = memo(function ThemeSelector({
  theme,
  onSelect,
}: {
  theme: ThemeName;
  onSelect: (theme: ThemeName) => void;
}) {
  return (
    <div className="inline-flex items-center border border-edge" role="group" aria-label="Theme">
      {THEME_OPTIONS.map((themeOption) => {
        const definition = THEME_DEFINITIONS[themeOption];
        const isActive = themeOption === theme;

        return (
          <button
            key={themeOption}
            type="button"
            onClick={() => onSelect(themeOption)}
            className={cn(
              "px-3 py-2 font-mono text-[10px] tracking-[0.2em] uppercase transition-all duration-300 focus:outline-hidden",
              isActive
                ? "bg-citrine/15 text-citrine"
                : "text-dim hover:text-cream"
            )}
            aria-label={`Switch theme to ${definition.label}`}
            aria-pressed={isActive}
          >
            {definition.label}
          </button>
        );
      })}
    </div>
  );
});

const SettingsDrawer = memo(function SettingsDrawer({
  isOpen,
  theme,
  onClose,
  onSelectTheme,
}: {
  isOpen: boolean;
  theme: ThemeName;
  onClose: () => void;
  onSelectTheme: (theme: ThemeName) => void;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-noir/60 backdrop-blur-sm"
        aria-label="Close appearance settings"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-edge bg-noir/95 p-6 backdrop-blur-enhanced">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <span className="mb-2 block font-mono text-[10px] tracking-[0.3em] text-dim uppercase">
              Appearance Settings
            </span>
            <h3 className="font-display text-3xl italic text-cream">Theme Control</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center border border-edge font-mono text-xs text-dim transition-colors duration-200 hover:border-cream hover:text-cream"
            aria-label="Close theme settings"
          >
            ×
          </button>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-stone">
          The shell owns theme state and broadcasts updates across the federation through shared CSS variables and the global theme event contract.
        </p>

        <div className="mb-8 space-y-3">
          {THEME_OPTIONS.map((themeOption) => {
            const definition = THEME_DEFINITIONS[themeOption];
            const isActive = themeOption === theme;

            return (
              <button
                key={themeOption}
                type="button"
                onClick={() => onSelectTheme(themeOption)}
                className={cn(
                  "w-full border px-4 py-4 text-left transition-all duration-300 focus:outline-hidden",
                  isActive
                    ? "border-citrine bg-citrine/10"
                    : "border-edge hover:border-edge-bright hover:bg-surface/70"
                )}
                aria-label={`Apply ${definition.label} theme from settings`}
                aria-pressed={isActive}
              >
                <div className="mb-2 flex items-center justify-between gap-4">
                  <span
                    className={cn(
                      "font-mono text-[11px] tracking-[0.3em] uppercase",
                      isActive ? "text-citrine" : "text-dim"
                    )}
                  >
                    {definition.label}
                  </span>
                  <span className="font-mono text-[10px] uppercase text-dim">
                    {isActive ? "Active" : "Available"}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-stone">{definition.description}</p>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-edge pt-6 font-mono text-[10px] tracking-wider text-dim uppercase">
          <span>Persisted in localStorage</span>
          <span>{THEME_STORAGE_KEY}</span>
        </div>
      </aside>
    </>
  );
});

const CommandPalette = memo(function CommandPalette({
  isOpen,
  query,
  onQueryChange,
  commands,
  onClose,
}: {
  isOpen: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  commands: readonly CommandAction[];
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-noir/65 backdrop-blur-sm"
        aria-label="Close command palette"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 top-8 z-50 mx-auto w-full max-w-2xl border border-edge bg-noir/95 shadow-2xl backdrop-blur-enhanced">
        <div className="border-b border-edge px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-4">
            <span className="font-mono text-[10px] tracking-[0.3em] text-dim uppercase">
              Command Palette
            </span>
            <span className="font-mono text-[10px] text-dim uppercase">Esc to close</span>
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search theme and navigation commands"
            className="w-full border border-edge bg-transparent px-4 py-3 font-mono text-sm text-cream placeholder:text-dim focus:outline-hidden"
            aria-label="Search commands"
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {commands.length > 0 ? (
            commands.map((command) => (
              <button
                key={command.id}
                type="button"
                onClick={command.run}
                className="w-full border-b border-edge px-5 py-4 text-left transition-colors duration-200 hover:bg-surface/70 focus:outline-hidden"
                aria-label={command.title}
              >
                <span className="mb-1 block font-mono text-[11px] tracking-[0.2em] text-cream uppercase">
                  {command.title}
                </span>
                <span className="text-sm text-stone">{command.subtitle}</span>
              </button>
            ))
          ) : (
            <div className="px-5 py-10 text-center">
              <span className="mb-3 block font-mono text-[11px] tracking-[0.3em] text-dim uppercase">
                No Matches
              </span>
              <p className="text-sm text-stone">
                Try searching for dark, light, dim, cart, products, or dashboard.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
});

function ModuleView({ module }: { module: ModuleConfig }): React.JSX.Element {
  const Component = module.component;

  const fallback = useMemo(() => {
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
      <Suspense fallback={fallback}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}

function ShellFrame(): React.JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<ThemeName>(() => getInitialTheme());
  const [isThemeDrawerOpen, setIsThemeDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");

  const activeModule = useMemo(() => getModuleForPath(location.pathname), [location.pathname]);

  useEffect(() => {
    if (location.pathname === "/") {
      navigate(ROOT_MODULE.path, { replace: true });
      return;
    }

    if (!KNOWN_PATHS.has(location.pathname)) {
      navigate(DEFAULT_MODULE.path, { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const handleShowNotification = (event: Event) => {
      const customEvent = event as CustomEvent<{ type: NotificationType; message: string }>;
      showToast(customEvent.detail.type, customEvent.detail.message);
    };

    window.addEventListener("showNotification", handleShowNotification);
    return () => window.removeEventListener("showNotification", handleShowNotification);
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) {
        return;
      }

      if (event.newValue === "dark" || event.newValue === "dim" || event.newValue === "light") {
        setTheme(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const handleNavigateToModule = (event: WindowEventMap["navigateToModule"]) => {
      const requestedModule = MODULES.find(
        (module) => module.id === event.detail.module
      );

      if (requestedModule && requestedModule.path !== location.pathname) {
        navigate(requestedModule.path);
      }
    };

    window.addEventListener("navigateToModule", handleNavigateToModule);
    return () => window.removeEventListener("navigateToModule", handleNavigateToModule);
  }, [location.pathname, navigate]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("moduleChange", {
        detail: { newModule: activeModule.id },
      })
    );

    PREFETCHERS[activeModule.id]();
  }, [activeModule]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      if (event.key === "Escape") {
        setIsThemeDrawerOpen(false);
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isCommandPaletteOpen) {
      setCommandQuery("");
    }
  }, [isCommandPaletteOpen]);

  const handleThemeChange = (nextTheme: ThemeName) => {
    if (nextTheme !== theme) {
      setTheme(nextTheme);
    }
  };

  const commandActions = useMemo<readonly CommandAction[]>(() => {
    const navigationCommands = MODULES.map((module) => ({
      id: `goto-${module.id}`,
      title: `Switch to ${module.label}`,
      subtitle: `Load the ${module.label.toLowerCase()} micro-frontend on port ${module.port}`,
      keywords: `${module.id} ${module.label.toLowerCase()} module navigation ${module.port}`,
      run: () => {
        navigate(module.path);
        setIsCommandPaletteOpen(false);
      },
    }));

    const themeCommands = THEME_OPTIONS.map((themeOption) => ({
      id: `theme-${themeOption}`,
      title: `Apply ${THEME_DEFINITIONS[themeOption].label} Theme`,
      subtitle: THEME_DEFINITIONS[themeOption].description,
      keywords: `${themeOption} theme appearance colors`,
      run: () => {
        handleThemeChange(themeOption);
        setIsCommandPaletteOpen(false);
      },
    }));

    return [...navigationCommands, ...themeCommands];
  }, [navigate]);

  const filteredCommands = useMemo(() => {
    const normalizedQuery = commandQuery.trim().toLowerCase();

    if (normalizedQuery.length === 0) {
      return commandActions;
    }

    return commandActions.filter((command) =>
      `${command.title} ${command.subtitle} ${command.keywords}`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [commandActions, commandQuery]);

  return (
    <div className="relative min-h-screen bg-noir">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--theme-grid-dot, rgba(250,250,249,0.5)) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="fixed left-0 right-0 top-0 z-50 h-px bg-linear-to-r from-transparent via-citrine/40 to-transparent" />

      <Toaster
        position="bottom-right"
        closeButton
        richColors={false}
        duration={3000}
        expand
        visibleToasts={3}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              "pointer-events-auto w-[min(360px,calc(100vw-2rem))] border border-edge bg-noir/96 px-4 py-3 shadow-2xl backdrop-blur-enhanced",
            title: "font-mono text-xs tracking-wide text-cream",
            description: "font-mono text-[11px] leading-relaxed text-stone",
            closeButton:
              "border border-edge bg-transparent text-dim transition-colors duration-200 hover:border-cream hover:text-cream",
            success: "border-mint/35 text-mint",
            error: "border-rose/35 text-rose",
            info: "border-edge text-stone",
          },
        }}
      />

      <SettingsDrawer
        isOpen={isThemeDrawerOpen}
        theme={theme}
        onClose={() => setIsThemeDrawerOpen(false)}
        onSelectTheme={handleThemeChange}
      />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        query={commandQuery}
        onQueryChange={setCommandQuery}
        commands={filteredCommands}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="border-b border-edge">
          <div className="mx-auto max-w-350 px-6 py-4 lg:px-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl italic tracking-tight text-cream">MF</span>
                <span className="font-mono text-[10px] tracking-[0.3em] text-dim uppercase">Demo</span>
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
                <nav className="flex flex-wrap items-center gap-1" aria-label="Module navigation">
                  {MODULES.map((module) => (
                    <NavigationItem key={module.id} module={module} />
                  ))}
                </nav>

                <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
                  <ThemeSelector theme={theme} onSelect={handleThemeChange} />
                  <button
                    type="button"
                    onClick={() => setIsThemeDrawerOpen(true)}
                    className="border border-edge px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-dim uppercase transition-all duration-300 hover:border-cream hover:text-cream focus:outline-hidden"
                    aria-label="Open appearance settings"
                  >
                    Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCommandPaletteOpen(true)}
                    className="border border-edge px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-dim uppercase transition-all duration-300 hover:border-cream hover:text-cream focus:outline-hidden"
                    aria-label="Open command palette"
                  >
                    Commands
                  </button>
                  <span className="hidden font-mono text-[10px] text-dim uppercase sm:inline">
                    {KEYBOARD_SHORTCUT_LABEL}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="border-b border-edge bg-surface/50">
          <div className="mx-auto max-w-350 px-6 lg:px-10">
            <div className="flex h-9 items-center justify-between">
              <div className="flex items-center gap-4 font-mono text-[11px] text-dim">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-citrine" />
                  <span>STREAMING</span>
                </div>
                <span className="text-edge">|</span>
                <span>{activeModule.id}</span>
                <span className="text-edge">|</span>
                <span>:{activeModule.port}</span>
              </div>
              <div className="flex items-center gap-4 font-mono text-[11px] text-dim">
                <span>React 19</span>
                <span className="text-edge">|</span>
                <span className="hidden sm:inline">Suspense</span>
                <span className="text-edge">|</span>
                <span className="hidden sm:inline">Module Federation</span>
                <span className="text-edge">|</span>
                <span>{THEME_DEFINITIONS[theme].label}</span>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="mx-auto max-w-350 px-6 py-10 lg:px-10">
            <Routes>
              {MODULES.map((module) => (
                <Route
                  key={module.id}
                  path={module.path}
                  element={<ModuleView module={module} />}
                />
              ))}
              <Route path="/" element={<Navigate to={ROOT_MODULE.path} replace />} />
              <Route path="*" element={<Navigate to={DEFAULT_MODULE.path} replace />} />
            </Routes>
          </div>
        </main>

        <footer className="mt-auto border-t border-edge">
          <div className="mx-auto max-w-350 px-6 lg:px-10">
            <div className="flex h-12 items-center justify-between font-mono text-[10px] tracking-wider text-dim uppercase">
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

function App(): React.JSX.Element {
  return (
    <BrowserRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <ShellFrame />
    </BrowserRouter>
  );
}

export default App;
