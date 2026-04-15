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
import {
  THEME_DEFINITIONS,
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

interface ModuleConfig {
  readonly id: ModuleType;
  readonly label: string;
  readonly path: string;
  readonly port: string;
  readonly component: React.LazyExoticComponent<React.ComponentType>;
}

interface Notification {
  id: string;
  type: "success" | "error" | "info";
  message: string;
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
const THEMES = Object.entries(THEME_DEFINITIONS) as Array<[
  ThemeName,
  (typeof THEME_DEFINITIONS)[ThemeName],
]>;

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

const ThemeSwitchButton = memo<{
  themeName: ThemeName;
  isActive: boolean;
  onSelect: (themeName: ThemeName) => void;
}>(({ themeName, isActive, onSelect }) => {
  const definition = THEME_DEFINITIONS[themeName];

  return (
    <button
      type="button"
      onClick={() => onSelect(themeName)}
      className={cn(
        "rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.28em] uppercase transition-colors duration-300",
        isActive
          ? "border-citrine bg-citrine/10 text-citrine"
          : "border-edge text-dim hover:border-edge-bright hover:text-cream"
      )}
      aria-label={`Switch theme to ${themeName}`}
      aria-pressed={isActive}
      title={definition.description}
    >
      {definition.label}
    </button>
  );
});

ThemeSwitchButton.displayName = "ThemeSwitchButton";

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
  const [activeTheme, setActiveTheme] = useState<ThemeName>(() => getInitialTheme());
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
    applyTheme(activeTheme, { persist: false, broadcast: false });
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

  const handleThemeChange = useCallback((themeName: ThemeName) => {
    setActiveTheme(themeName);
    applyTheme(themeName);
  }, []);

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
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-2xl italic text-cream tracking-tight">
                    MF
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.3em] text-dim uppercase">
                    Demo
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {THEMES.map(([themeName]) => (
                    <ThemeSwitchButton
                      key={themeName}
                      themeName={themeName}
                      isActive={activeTheme === themeName}
                      onSelect={handleThemeChange}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
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
                <span>{THEME_DEFINITIONS[activeTheme].label}</span>
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

export default App; import React, {
  Suspense,
  lazy,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "./lib/utils";
import {
  DEFAULT_THEME,

const MODULES: readonly ModuleConfig[] = [
    {
      id: "products",
      label: "Products",
      port: "3001",
      component: StreamingProductsCatalog,
    },
    {
      id: "cart",
      label: "Cart",
      port: "3002",
      component: StreamingShoppingCart,
    },
    {
      id: "dashboard",
      label: "Dashboard",
      port: "3003",
      component: StreamingUserDashboard,
    },
  ] as const;

const THEME_OPTIONS: readonly ThemeName[] = ["dark", "dim", "light"] as const;
const KEYBOARD_SHORTCUT_LABEL = "Ctrl/Cmd + K";

const NavigationButton = memo<{
  module: ModuleConfig;
  isActive: boolean;
  onClick: (moduleId: ModuleType) => void;
}>(({ module, isActive, onClick }) => {
  const handleMouseEnter = useCallback(() => {
    if (!isActive) {
      PREFETCH_MAP[module.id]();
    }
  }, [isActive, module.id]);

  return (
    <button
      type="button"
      onClick={() => onClick(module.id)}
      onMouseEnter={handleMouseEnter}
      className={cn(
        "relative px-5 py-2.5 font-mono text-sm tracking-wide transition-all duration-500 focus:outline-hidden",
        isActive ? "text-citrine" : "text-stone hover:text-cream"
      )}
      aria-pressed={isActive}
      aria-label={`Switch to ${module.label}`}
    >
      <span className="relative z-10">{module.label.toUpperCase()}</span>
      <span
        className={cn(
          "absolute bottom-0 left-0 h-0.5 bg-citrine transition-all duration-500",
          isActive ? "w-full" : "w-0"
        )}
      />
    </button>
  );
});

NavigationButton.displayName = "NavigationButton";

const ThemeSelector = memo<{
  theme: ThemeName;
  onSelect: (theme: ThemeName) => void;
  compact?: boolean;
}>(({ theme, onSelect, compact = false }) => (
  <div
    className={cn(
      "inline-flex items-center gap-1 rounded-full border border-edge bg-surface/70 p-1",
      compact && "scale-95 origin-right"
    )}
    role="group"
    aria-label="Theme switcher"
  >
    {THEME_OPTIONS.map((themeOption) => {
      const definition = THEME_DEFINITIONS[themeOption];
      const isActive = theme === themeOption;

      return (
        <button
          key={themeOption}
          type="button"
          onClick={() => onSelect(themeOption)}
          className={cn(
            "rounded-full px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] uppercase transition-all duration-300 focus:outline-hidden",
            isActive ? "bg-citrine text-ink" : "text-dim hover:text-cream"
          )}
          aria-pressed={isActive}
          aria-label={`Switch theme to ${definition.label}`}
          title={definition.description}
        >
          {definition.label}
        </button>
      );
    })}
  </div>
));

ThemeSelector.displayName = "ThemeSelector";

const SettingsDrawer = memo<{
  isOpen: boolean;
  theme: ThemeName;
  onClose: () => void;
  onSelectTheme: (theme: ThemeName) => void;
}>(({ isOpen, theme, onClose, onSelectTheme }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close appearance settings"
        className="fixed inset-0 z-40 bg-noir/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-edge bg-noir/95 p-6 backdrop-blur-enhanced">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <span className="font-mono text-[10px] tracking-[0.3em] text-dim uppercase block mb-2">
              Appearance Settings
            </span>
            <h3 className="font-display text-3xl italic text-cream">
              Theme Control
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 border border-edge text-dim hover:text-cream hover:border-cream transition-colors duration-200 flex items-center justify-center font-mono text-xs"
            aria-label="Close theme settings"
          >
            &times;
          </button>
        </div>

        <p className="text-stone text-sm leading-relaxed mb-6">
          The shell owns theme state and pushes it to every remote through shared CSS variables and the global theme event contract.
        </p>

        <div className="space-y-3 mb-8">
          {THEME_OPTIONS.map((themeOption) => {
            const definition = THEME_DEFINITIONS[themeOption];
            const isActive = theme === themeOption;

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
                aria-pressed={isActive}
                aria-label={`Apply ${definition.label} theme from settings`}
              >
                <div className="flex items-center justify-between gap-4 mb-2">
                  <span className={cn(
                    "font-mono text-[11px] tracking-[0.3em] uppercase",
                    isActive ? "text-citrine" : "text-dim"
                  )}>
                    {definition.label}
                  </span>
                  <span className="font-mono text-[10px] text-dim uppercase">
                    {isActive ? "Active" : "Available"}
                  </span>
                </div>
                <p className="text-stone text-sm leading-relaxed">
                  {definition.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="border-t border-edge pt-6 font-mono text-[10px] tracking-wider text-dim uppercase flex items-center justify-between gap-4">
          <span>Persisted in localStorage</span>
          <span>{THEME_STORAGE_KEY}</span>
        </div>
      </aside>
    </>
  );
});

SettingsDrawer.displayName = "SettingsDrawer";

const CommandPalette = memo<{
  isOpen: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  commands: readonly CommandAction[];
  onClose: () => void;
}>(({ isOpen, query, onQueryChange, commands, onClose }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    inputRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close command palette"
        className="fixed inset-0 z-40 bg-noir/65 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 top-8 z-50 mx-auto w-full max-w-2xl border border-edge bg-noir/95 shadow-2xl backdrop-blur-enhanced">
        <div className="border-b border-edge px-5 py-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <span className="font-mono text-[10px] tracking-[0.3em] text-dim uppercase">
              Command Palette
            </span>
            <span className="font-mono text-[10px] text-dim uppercase">
              Esc to close
            </span>
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search theme and navigation commands"
            className="w-full bg-transparent border border-edge px-4 py-3 text-cream placeholder:text-dim font-mono text-sm focus:outline-hidden"
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
                className="w-full border-b border-edge px-5 py-4 text-left hover:bg-surface/70 transition-colors duration-200 focus:outline-hidden"
                aria-label={command.title}
              >
                <span className="font-mono text-[11px] tracking-[0.2em] text-cream uppercase block mb-1">
                  {command.title}
                </span>
                <span className="text-stone text-sm">{command.subtitle}</span>
              </button>
            ))
          ) : (
            <div className="px-5 py-10 text-center">
              <span className="font-mono text-[11px] tracking-[0.3em] text-dim uppercase block mb-3">
                No Matches
              </span>
              <p className="text-stone text-sm">
                Try searching for dark, light, dim, cart, products, or dashboard.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
});

CommandPalette.displayName = "CommandPalette";

function App(): React.JSX.Element {
  const [activeModule, setActiveModule] = useState<ModuleType>("products");
  const [theme, setTheme] = useState<ThemeName>(
    () => window.__MF_THEME__?.getTheme() ?? getInitialTheme()
  );
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isThemeDrawerOpen, setIsThemeDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const hasMountedRef = useRef(false);

  const activeConfig = MODULES.find((module) => module.id === activeModule)!;
  const activeTheme = THEME_DEFINITIONS[theme];

  const enqueueNotification = useCallback((type: Notification["type"], message: string) => {
    setNotifications((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type,
        message,
      },
      ...prev.slice(0, 2),
    ]);
  }, []);

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

  const handleModuleChange = useCallback((moduleId: ModuleType) => {
    if (moduleId === activeModule) {
      return;
    }

    const moduleLabel = MODULES.find((module) => module.id === moduleId)?.label ?? moduleId;

    if (!document.startViewTransition) {
      setActiveModule(moduleId);
      dispatchModuleChange(moduleId);
      enqueueNotification("info", `${moduleLabel} module loaded`);
      return;
    }

    document.startViewTransition(() => {
      setActiveModule(moduleId);
      dispatchModuleChange(moduleId);
      enqueueNotification("info", `${moduleLabel} module loaded`);
    });
  }, [activeModule, dispatchModuleChange, enqueueNotification]);

  const handleThemeChange = useCallback((nextTheme: ThemeName) => {
    if (nextTheme === theme) {
      return;
    }

    const nextThemeLabel = THEME_DEFINITIONS[nextTheme].label;

    if (!document.startViewTransition) {
      setTheme(nextTheme);
      enqueueNotification("info", `${nextThemeLabel} theme applied`);
      return;
    }

    document.startViewTransition(() => {
      setTheme(nextTheme);
      enqueueNotification("info", `${nextThemeLabel} theme applied`);
    });
  }, [enqueueNotification, theme]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) {
        return;
      }

      const nextTheme = event.newValue;
      setTheme(
        nextTheme === "dark" || nextTheme === "dim" || nextTheme === "light"
          ? nextTheme
          : DEFAULT_THEME
      );
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const handleNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type, message } = customEvent.detail;
      enqueueNotification(type, message);
    };

    window.addEventListener("showNotification", handleNotification);
    return () => window.removeEventListener("showNotification", handleNotification);
  }, [enqueueNotification]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    PREFETCH_MAP[activeModule]();
  }, [activeModule]);

  useEffect(() => {
    if (notifications.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      setNotifications((prev) => prev.slice(0, -1));
    }, 3000);

    return () => clearTimeout(timer);
  }, [notifications]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      if (event.key === "Escape") {
        setIsCommandPaletteOpen(false);
        setIsThemeDrawerOpen(false);
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

  const paletteCommands = useMemo<readonly CommandAction[]>(() => {
    const navigationCommands: CommandAction[] = MODULES.map((module) => ({
      id: `navigate-${module.id}`,
      title: `Switch to ${module.label}`,
      subtitle: `Load the ${module.label.toLowerCase()} micro-frontend on port ${module.port}`,
      keywords: `${module.id} ${module.label.toLowerCase()} navigate module ${module.port}`,
      run: () => {
        handleModuleChange(module.id);
        setIsCommandPaletteOpen(false);
      },
    }));

    const themeCommands: CommandAction[] = THEME_OPTIONS.map((themeOption) => ({
      id: `theme-${themeOption}`,
      title: `Apply ${THEME_DEFINITIONS[themeOption].label} Theme`,
      subtitle: THEME_DEFINITIONS[themeOption].description,
      keywords: `${themeOption} theme appearance color mode`,
      run: () => {
        handleThemeChange(themeOption);
        setIsCommandPaletteOpen(false);
      },
    }));

    return [...navigationCommands, ...themeCommands];
  }, [handleModuleChange, handleThemeChange]);

  const filteredCommands = useMemo(() => {
    const normalizedQuery = commandQuery.trim().toLowerCase();

    if (normalizedQuery.length === 0) {
      return paletteCommands;
    }

    return paletteCommands.filter((command) =>
      `${command.title} ${command.subtitle} ${command.keywords}`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [commandQuery, paletteCommands]);

  const renderedModule = useMemo(() => {
    const Component = activeConfig.component;

    const skeleton = (() => {
      switch (activeConfig.id) {
        case "products":
          return <ProductsSkeleton />;
        case "cart":
          return <CartSkeleton />;
        case "dashboard":
          return <DashboardSkeleton />;
        default:
          return <ProductsSkeleton />;
      }
    })();

    return (
      <ErrorBoundary>
        <Suspense fallback={skeleton} key={activeModule}>
          <Component />
        </Suspense>
      </ErrorBoundary>
    );
  }, [activeConfig, activeModule]);

  return (
    <div className="min-h-screen bg-noir relative">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--theme-grid-dot, rgba(250,250,249,0.5)) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="fixed top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-citrine/40 to-transparent z-50" />

      <div className="fixed top-6 right-6 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "px-4 py-2.5 border font-mono text-xs tracking-wide transition-all duration-300 animate-in slide-in-from-right",
              notification.type === "success" && "bg-noir border-mint/30 text-mint",
              notification.type === "error" && "bg-noir border-rose/30 text-rose",
              notification.type === "info" && "bg-noir border-edge text-stone"
            )}
          >
            {notification.message}
          </div>
        ))}
      </div>

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

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="border-b border-edge">
          <div className="max-w-350 mx-auto px-6 lg:px-10">
            <div className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl italic text-cream tracking-tight">MF</span>
                <span className="font-mono text-[10px] tracking-[0.3em] text-dim uppercase">Demo</span>
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
                <nav className="flex flex-wrap items-center gap-1" role="navigation" aria-label="Module navigation">
                  {MODULES.map((module) => (
                    <NavigationButton
                      key={module.id}
                      module={module}
                      isActive={activeModule === module.id}
                      onClick={handleModuleChange}
                    />
                  ))}
                </nav>

                <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
                  <span className="font-mono text-[10px] tracking-[0.3em] text-dim uppercase">
                    Theme
                  </span>
                  <ThemeSelector theme={theme} onSelect={handleThemeChange} compact />
                  <button
                    type="button"
                    onClick={() => setIsThemeDrawerOpen(true)}
                    className="border border-edge px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-dim uppercase hover:border-cream hover:text-cream transition-all duration-300 focus:outline-hidden"
                    aria-label="Open appearance settings"
                  >
                    Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCommandPaletteOpen(true)}
                    className="border border-edge px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-dim uppercase hover:border-cream hover:text-cream transition-all duration-300 focus:outline-hidden"
                    aria-label="Open command palette"
                  >
                    Commands
                  </button>
                  <span className="font-mono text-[10px] text-dim uppercase hidden sm:inline">
                    {KEYBOARD_SHORTCUT_LABEL}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="border-b border-edge bg-surface/50">
          <div className="max-w-350 mx-auto px-6 lg:px-10">
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
              <div className="font-mono text-[11px] text-dim flex items-center gap-4">
                <span>React 19</span>
                <span className="text-edge">|</span>
                <span className="hidden sm:inline">Suspense</span>
                <span className="text-edge">|</span>
                <span className="hidden sm:inline">Module Federation</span>
                <span className="text-edge">|</span>
                <span>{activeTheme.label}</span>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="max-w-350 mx-auto px-6 lg:px-10 py-10">
            {renderedModule}
          </div>
        </main>

        <footer className="border-t border-edge mt-auto">
          <div className="max-w-350 mx-auto px-6 lg:px-10">
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
import {
  THEME_DEFINITIONS,
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

interface ModuleConfig {
  readonly id: ModuleType;
  readonly label: string;
  readonly path: string;
  readonly port: string;
  readonly component: React.LazyExoticComponent<React.ComponentType>;
}

interface Notification {
  id: string;
  type: "success" | "error" | "info";
  message: string;
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
const THEMES = Object.entries(THEME_DEFINITIONS) as Array<[
  ThemeName,
  (typeof THEME_DEFINITIONS)[ThemeName],
]>;

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

const ThemeSwitchButton = memo<{
  themeName: ThemeName;
  isActive: boolean;
  onSelect: (themeName: ThemeName) => void;
}>(({ themeName, isActive, onSelect }) => {
  const definition = THEME_DEFINITIONS[themeName];

  return (
    <button
      type="button"
      onClick={() => onSelect(themeName)}
      className={cn(
        "rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.28em] uppercase transition-colors duration-300",
        isActive
          ? "border-citrine bg-citrine/10 text-citrine"
          : "border-edge text-dim hover:border-edge-bright hover:text-cream"
      )}
      aria-label={`Switch theme to ${themeName}`}
      aria-pressed={isActive}
      title={definition.description}
    >
      {definition.label}
    </button>
  );
});

ThemeSwitchButton.displayName = "ThemeSwitchButton";

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
  const [activeTheme, setActiveTheme] = useState<ThemeName>(() => getInitialTheme());
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
    applyTheme(activeTheme, { persist: false, broadcast: false });
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

  const handleThemeChange = useCallback((themeName: ThemeName) => {
    setActiveTheme(themeName);
    applyTheme(themeName);
  }, []);

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
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-2xl italic text-cream tracking-tight">
                    MF
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.3em] text-dim uppercase">
                    Demo
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {THEMES.map(([themeName]) => (
                    <ThemeSwitchButton
                      key={themeName}
                      themeName={themeName}
                      isActive={activeTheme === themeName}
                      onSelect={handleThemeChange}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
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
                <span>{THEME_DEFINITIONS[activeTheme].label}</span>
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
