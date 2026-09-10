import React, {
  Suspense,
  lazy,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
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
import DemoPanel from "./components/DemoPanel";
import SharedStateBar from "./components/SharedStateBar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./components/ui/tooltip";
import HomeSkeleton from "./components/HomeSkeleton";
import RecordsSkeleton from "./components/RecordsSkeleton";
import PrescriptionsSkeleton from "./components/PrescriptionsSkeleton";
import AnalyticsSkeleton from "./components/AnalyticsSkeleton";
import { useRemoteHealth } from "./lib/health";
import { useKillSwitch } from "./lib/demo";

// ---------------------------------------------------------------------------
// Loading strategies — not every module should load the same way:
//   INSTANT:  Home     — lazy-loaded for code splitting, no streaming delay.
//                        Renders the moment the chunk arrives.
//   EAGER:    Records  — standalone component, preloaded on shell mount.
//                        Chunk is already cached before the user clicks.
//   STREAMED: Prescriptions, Analytics — loaded on demand with skeleton fallbacks.
// ---------------------------------------------------------------------------

type RemoteModule = { default: ComponentType };

function loadRemote(
  importer: () => Promise<RemoteModule>,
  label: string,
  title: string,
  message: string
): Promise<RemoteModule> {
  return importer().catch((error: unknown) => {
    console.error(`Failed to load ${label}:`, error);
    return {
      default: () => <ModuleFallback title={title} message={message} />,
    };
  });
}

// INSTANT — Home loads without a streaming delay. We import the standalone
// component (home/Home) instead of the streaming wrapper. Still lazy for code
// splitting, but the user sees real content the moment the chunk arrives.
const Home = lazy(() =>
  loadRemote(
    () => import("home/Home"),
    "Home",
    "Home Module Unavailable",
    "The home service is currently unavailable."
  )
);

// EAGER — Records is preloaded immediately (see EAGER_PRELOAD below) and
// imports the standalone component directly — no streaming delay. By the time
// the user navigates here, the chunk is already cached.
const MedicalRecords = lazy(() =>
  loadRemote(
    () => import("records/MedicalRecords"),
    "MedicalRecords",
    "Records Module Unavailable",
    "The records service is currently unavailable."
  )
);

// STREAMED — Prescriptions and Analytics load on demand with skeleton fallbacks.
const StreamingPrescriptionOrders = lazy(() =>
  loadRemote(
    () => import("prescriptions/StreamingPrescriptionOrders"),
    "StreamingPrescriptionOrders",
    "Prescriptions Module Unavailable",
    "The prescriptions service is currently unavailable."
  )
);

const StreamingClinicalAnalytics = lazy(() =>
  loadRemote(
    () => import("analytics/StreamingClinicalAnalytics"),
    "StreamingClinicalAnalytics",
    "Analytics Module Unavailable",
    "The analytics service is currently unavailable."
  )
);

type ModuleType = "home" | "records" | "prescriptions" | "analytics";
type NotificationType = "success" | "error" | "info" | "warning";

type CommandAction = {
  id: string;
  title: string;
  subtitle: string;
  keywords: string;
  run: () => void;
};

type LoadStrategy = "instant" | "eager" | "streamed";

type RenderBenchmark = {
  readonly id: ModuleType;
  readonly label: string;
  readonly strategy: string;
  readonly detail: string;
  readonly firstTimingMs: number | null;
  readonly latestTimingMs: number | null;
  readonly runs: number;
};

type RenderTimingState = {
  readonly firstTimingMs: number;
  readonly latestTimingMs: number;
  readonly runs: number;
};

type ModuleConfig = {
  id: ModuleType;
  label: string;
  path: string;
  port: string;
  component: React.LazyExoticComponent<React.ComponentType>;
  loadStrategy: LoadStrategy;
  /**
   * Warm this remote's chunk when the cursor enters its nav link.
   * `prescriptions` opts out deliberately, so the demo keeps one module with no
   * prefetch at all to compare against. Do not "fix" it to true.
   */
  prefetchOnHover: boolean;
};

const MODULES = [
  {
    id: "home",
    label: "Home",
    path: "/",
    port: "3004",
    component: Home,
    loadStrategy: "instant",
    prefetchOnHover: true,
  },
  {
    id: "records",
    label: "Records",
    path: "/records",
    port: "3001",
    component: MedicalRecords,
    loadStrategy: "eager",
    prefetchOnHover: true,
  },
  {
    id: "prescriptions",
    label: "Prescriptions",
    path: "/prescriptions",
    port: "3002",
    component: StreamingPrescriptionOrders,
    loadStrategy: "streamed",
    // Deliberate: the one module with no prefetch, as a control.
    prefetchOnHover: false,
  },
  {
    id: "analytics",
    label: "Analytics",
    path: "/analytics",
    port: "3003",
    component: StreamingClinicalAnalytics,
    loadStrategy: "streamed",
    prefetchOnHover: true,
  },
] as const satisfies readonly ModuleConfig[];

const DEFAULT_MODULE = MODULES[0]!;
const ROOT_MODULE = DEFAULT_MODULE;
const MODULE_BY_PATH = new Map<string, ModuleConfig>(
  MODULES.map((module) => [module.path, module])
);
const KNOWN_PATHS = new Set<string>(MODULES.map((module) => module.path));
const THEME_OPTIONS: readonly ThemeName[] = ["dark", "light"] as const;
const KEYBOARD_SHORTCUT_LABEL = "Ctrl/Cmd + K";

// Warms a remote's chunk ahead of render. Each specifier must match its lazy()
// import above exactly — a missing key fails to compile, but drift does not, and
// silently breaks eager + hover prefetch. .catch keeps a dead remote from throwing
// an unhandled rejection; loadRemote() does the real error handling.
const PREFETCHERS: Record<ModuleType, () => Promise<unknown>> = {
  home: () => import("home/Home").catch(() => undefined),
  records: () => import("records/MedicalRecords").catch(() => undefined),
  prescriptions: () => import("prescriptions/StreamingPrescriptionOrders").catch(() => undefined),
  analytics: () => import("analytics/StreamingClinicalAnalytics").catch(() => undefined),
};

const BENCHMARK_TARGETS = [
  {
    id: "records",
    label: "Records",
    strategy: "Eager",
    detail: "Preloaded when the shell mounts.",
  },
  {
    id: "prescriptions",
    label: "Prescriptions",
    strategy: "On click",
    detail: "No eager load and no hover prefetch.",
  },
  {
    id: "analytics",
    label: "Analytics",
    strategy: "Hover prefetch",
    detail: "Remote chunk prefetches on hover before click.",
  },
] as const satisfies readonly Omit<RenderBenchmark, "firstTimingMs" | "latestTimingMs" | "runs">[];

// Eagerly preload modules marked as "eager" so their chunks (and streaming
// delays) resolve before the user navigates. This fires once at module
// evaluation time — the very first thing the shell does after importing.
const EAGER_MODULES = MODULES.filter((m) => m.loadStrategy === "eager");
for (const m of EAGER_MODULES) {
  PREFETCHERS[m.id]();
}

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

// Four distinct fetch timings from two independent switches: `loadStrategy`
// decides whether the chunk is preloaded at init, and `prefetchOnHover` decides
// whether hovering warms it. Prescriptions opts out of hover on purpose so the
// demo has a true no-prefetch control to compare against.
function describeLoading(module: ModuleConfig): {
  readonly title: string;
  readonly detail: string;
} {
  if (module.loadStrategy === "instant") {
    return {
      title: "Instant",
      detail: "Landing route — its chunk arrives with the initial page load.",
    };
  }

  if (module.loadStrategy === "eager") {
    return {
      title: "Preloaded",
      detail:
        "Fetched at shell init, before you touch anything. Already cached by the time you click.",
    };
  }

  return module.prefetchOnHover
    ? {
        title: "Prefetched on hover",
        detail:
          "Fetching right now, while your cursor travels to the link — so the click feels instant.",
      }
    : {
        title: "Lazy",
        detail:
          "Nothing is fetched until you click. Hovering does nothing — watch the network tab.",
      };
}

const NavigationItem = memo(function NavigationItem({
  module,
  onNavigateStart,
}: {
  module: ModuleConfig;
  onNavigateStart: (module: ModuleConfig) => void;
}) {
  const loading = describeLoading(module);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <NavLink
            to={module.path}
            onMouseEnter={() => {
              if (module.prefetchOnHover) {
                PREFETCHERS[module.id]();
              }
            }}
            onClick={() => onNavigateStart(module)}
            className={({ isActive }) =>
              cn(
                "relative px-5 py-2.5 font-mono text-sm tracking-wide transition-all duration-500 focus:outline-hidden",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
            aria-label={`Navigate to ${module.label}`}
          >
            {({ isActive }) => (
              <>
                <span className="relative z-10">{module.label.toUpperCase()}</span>
                <span
                  className={cn(
                    "absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-500",
                    isActive ? "w-full" : "w-0"
                  )}
                />
              </>
            )}
          </NavLink>
        }
      />
      <TooltipContent side="bottom" sideOffset={6} className="max-w-64 rounded-md">
        <span className="flex flex-col gap-1 py-0.5 text-left">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase opacity-70">
            {loading.title}
          </span>
          <span className="text-xs leading-snug">{loading.detail}</span>
          <span className="font-mono text-[10px] opacity-70">
            {module.id} · :{module.port}
          </span>
        </span>
      </TooltipContent>
    </Tooltip>
  );
});

function RenderTimingMarker({
  moduleId,
  onRendered,
  children,
}: {
  moduleId: ModuleType;
  onRendered: (moduleId: ModuleType) => void;
  children: React.ReactNode;
}): React.JSX.Element {
  useEffect(() => {
    onRendered(moduleId);
  }, [moduleId, onRendered]);

  return <>{children}</>;
}

const ThemeSelector = memo(function ThemeSelector({
  theme,
  onSelect,
}: {
  theme: ThemeName;
  onSelect: (theme: ThemeName) => void;
}) {
  return (
    <div className="inline-flex items-center border border-border" role="group" aria-label="Theme">
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
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground/70 hover:text-foreground"
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
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
        aria-label="Close appearance settings"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-border bg-background/95 p-6 backdrop-blur-enhanced">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <span className="mb-2 block font-mono text-[10px] tracking-[0.3em] text-muted-foreground/70 uppercase">
              Appearance Settings
            </span>
            <h3 className="font-sans font-semibold text-xl text-foreground">Theme Control</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center border border-border font-mono text-xs text-muted-foreground/70 transition-colors duration-200 hover:border-foreground hover:text-foreground"
            aria-label="Close theme settings"
          >
            ×
          </button>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
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
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-ring hover:bg-card/70"
                )}
                aria-label={`Apply ${definition.label} theme from settings`}
                aria-pressed={isActive}
              >
                <div className="mb-2 flex items-center justify-between gap-4">
                  <span
                    className={cn(
                      "font-mono text-[11px] tracking-[0.3em] uppercase",
                      isActive ? "text-primary" : "text-muted-foreground/70"
                    )}
                  >
                    {definition.label}
                  </span>
                  <span className="font-mono text-[10px] uppercase text-muted-foreground/70">
                    {isActive ? "Active" : "Available"}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{definition.description}</p>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border pt-6 font-mono text-[10px] tracking-wider text-muted-foreground/70 uppercase">
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
        className="fixed inset-0 z-40 bg-background/65 backdrop-blur-sm"
        aria-label="Close command palette"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 top-8 z-50 mx-auto w-full max-w-2xl border border-border bg-background/95 shadow-2xl backdrop-blur-enhanced">
        <div className="border-b border-border px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-4">
            <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/70 uppercase">
              Command Palette
            </span>
            <span className="font-mono text-[10px] text-muted-foreground/70 uppercase">Esc to close</span>
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search theme and navigation commands"
            className="w-full border border-border bg-transparent px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-hidden rounded-md"
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
                className="w-full border-b border-border px-5 py-4 text-left transition-colors duration-200 hover:bg-card/70 focus:outline-hidden"
                aria-label={command.title}
              >
                <span className="mb-1 block font-mono text-[11px] tracking-[0.2em] text-foreground uppercase">
                  {command.title}
                </span>
                <span className="text-sm text-muted-foreground">{command.subtitle}</span>
              </button>
            ))
          ) : (
            <div className="px-5 py-10 text-center">
              <span className="mb-3 block font-mono text-[11px] tracking-[0.3em] text-muted-foreground/70 uppercase">
                No Matches
              </span>
              <p className="text-sm text-muted-foreground">
                Try searching for dark, light, prescriptions, records, home, or analytics.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
});

function ModuleView({
  module,
  isKilled,
  onRendered,
}: {
  module: ModuleConfig;
  isKilled: boolean;
  onRendered: (moduleId: ModuleType) => void;
}): React.JSX.Element {
  const Component = module.component;

  const fallback = useMemo(() => {
    switch (module.id) {
      case "home":
        return <HomeSkeleton />;
      case "records":
        return <RecordsSkeleton />;
      case "prescriptions":
        return <PrescriptionsSkeleton />;
      case "analytics":
        return <AnalyticsSkeleton />;
      default:
        return <HomeSkeleton />;
    }
  }, [module.id]);

  if (isKilled) {
    return (
      <ModuleFallback
        title={`${module.label} Module Killed`}
        message={`This remote (port ${module.port}) has been intentionally taken down via the demo kill switch. Other modules continue to function independently — this is fault isolation in action.`}
      />
    );
  }

  return (
    <ErrorBoundary key={module.id}>
      <Suspense key={module.id} fallback={fallback}>
        <RenderTimingMarker moduleId={module.id} onRendered={onRendered}>
          <Component />
        </RenderTimingMarker>
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
  const [isDemoPanelOpen, setIsDemoPanelOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const renderStartTimes = useRef<Partial<Record<ModuleType, number>>>({});
  const [renderTimings, setRenderTimings] = useState<
    Partial<Record<ModuleType, RenderTimingState>>
  >({});

  const moduleIds = useMemo(() => MODULES.map((m) => m.id as string), []);
  const remoteSpecs = useMemo(() => MODULES.map((m) => ({ id: m.id, port: m.port })), []);
  const health = useRemoteHealth(remoteSpecs, isDemoPanelOpen);
  const { killed, toggle: toggleKill, killAll, restoreAll } = useKillSwitch(moduleIds);

  const activeModule = useMemo(() => getModuleForPath(location.pathname), [location.pathname]);

  const handleNavigateStart = useCallback((module: ModuleConfig) => {
    renderStartTimes.current[module.id] = performance.now();
  }, []);

  const handleModuleRendered = useCallback((moduleId: ModuleType) => {
    const startedAt = renderStartTimes.current[moduleId];

    if (startedAt === undefined) {
      return;
    }

    const timingMs = Math.round(performance.now() - startedAt);
    delete renderStartTimes.current[moduleId];

    setRenderTimings((current) => {
      const currentTiming = current[moduleId];

      return {
        ...current,
        [moduleId]: {
          firstTimingMs: currentTiming?.firstTimingMs ?? timingMs,
          latestTimingMs: timingMs,
          runs: (currentTiming?.runs ?? 0) + 1,
        },
      };
    });
  }, []);

  const renderBenchmarks = useMemo<readonly RenderBenchmark[]>(
    () =>
      BENCHMARK_TARGETS.map((target) => {
        const timing = renderTimings[target.id];

        return {
          ...target,
          firstTimingMs: timing?.firstTimingMs ?? null,
          latestTimingMs: timing?.latestTimingMs ?? null,
          runs: timing?.runs ?? 0,
        };
      }),
    [renderTimings]
  );

  useEffect(() => {
    if (location.pathname !== "/" && !KNOWN_PATHS.has(location.pathname)) {
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

      if (event.newValue === "dark" || event.newValue === "light") {
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

    // Mostly redundant with lazy() — except when the module is killed. ModuleView
    // returns early on isKilled, so <Component /> never mounts and lazy() never
    // imports; this is then the only thing warming the chunk, which is why restore
    // is instant. Do not remove.
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
        setIsCommandPaletteOpen(false); setIsDemoPanelOpen(false);
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

    const demoCommands: CommandAction[] = [
      {
        id: "demo-panel",
        title: "Open Federation Lab",
        subtitle: "Health monitor, kill switches, and fault isolation",
        keywords: "demo lab federation health kill fault isolation",
        run: () => {
          setIsDemoPanelOpen(true);
          setIsCommandPaletteOpen(false);
        },
      },
      ...MODULES.map((module) => ({
        id: `kill-${module.id}`,
        title: `${killed[module.id] ? "Restore" : "Kill"} ${module.label} Remote`,
        subtitle: `${killed[module.id] ? "Bring back" : "Simulate failure of"} the ${module.label.toLowerCase()} service on port ${module.port}`,
        keywords: `kill restore fault isolation ${module.id} ${module.label.toLowerCase()} down`,
        run: () => {
          toggleKill(module.id);
          setIsCommandPaletteOpen(false);
        },
      })),
    ];

    return [...navigationCommands, ...themeCommands, ...demoCommands];
  }, [navigate, killed]);

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
    <div className="relative min-h-screen bg-background">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--theme-grid-dot, rgba(250,250,249,0.5)) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="fixed left-0 right-0 top-0 z-50 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />

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
              "pointer-events-auto w-[min(360px,calc(100vw-2rem))] border border-border bg-background/96 px-4 py-3 shadow-2xl backdrop-blur-enhanced",
            title: "font-mono text-xs tracking-wide text-foreground",
            description: "font-mono text-[11px] leading-relaxed text-muted-foreground",
            closeButton:
              "border border-border bg-transparent text-muted-foreground/70 transition-colors duration-200 hover:border-foreground hover:text-foreground",
            success: "border-chart-2/35 text-chart-2",
            error: "border-destructive/35 text-destructive",
            info: "border-border text-muted-foreground",
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
      <DemoPanel
        isOpen={isDemoPanelOpen}
        onClose={() => setIsDemoPanelOpen(false)}
        health={health}
        killed={killed}
        onToggleKill={toggleKill}
        onKillAll={killAll}
        onRestoreAll={restoreAll}
        renderBenchmarks={renderBenchmarks}
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="border-b border-border">
          <div className="mx-auto max-w-screen-2xl px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-baseline gap-2">
                <span className="font-sans font-semibold text-lg tracking-tight text-foreground">MF</span>
                <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/70 uppercase">Demo</span>
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
                {/* delay={150} keeps the tooltip quick enough to feel responsive
                    while demoing, without flashing as the cursor crosses the nav. */}
                <TooltipProvider delay={150}>
                  <nav className="flex flex-wrap items-center gap-1" aria-label="Module navigation">
                    {MODULES.map((module) => (
                      <NavigationItem
                        key={module.id}
                        module={module}
                        onNavigateStart={handleNavigateStart}
                      />
                    ))}
                  </nav>
                </TooltipProvider>

                <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
                  <ThemeSelector theme={theme} onSelect={handleThemeChange} />
                  <button
                    type="button"
                    onClick={() => setIsThemeDrawerOpen(true)}
                    className="border border-border px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase transition-all duration-300 hover:border-foreground hover:text-foreground focus:outline-hidden rounded-md"
                    aria-label="Open appearance settings"
                  >
                    Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCommandPaletteOpen(true)}
                    className="border border-border px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase transition-all duration-300 hover:border-foreground hover:text-foreground focus:outline-hidden rounded-md"
                    aria-label="Open command palette"
                  >
                    Commands
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDemoPanelOpen(true)}
                    className="border border-chart-4/40 px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-chart-4 uppercase transition-all duration-300 hover:border-chart-4 hover:bg-chart-4/10 focus:outline-hidden"
                    aria-label="Open federation lab demo panel"
                  >
                    Lab
                  </button>
                  <span className="hidden font-mono text-[10px] text-muted-foreground/70 uppercase sm:inline">
                    {KEYBOARD_SHORTCUT_LABEL}
                  </span>
                  {/* The host's own zustand store + QueryClient. It shares neither
                      with the remotes — they agree on the counterChange contract. */}
                  <SharedStateBar />
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="border-b border-border bg-card/50">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-12 items-center justify-between">
              <div className="flex items-center gap-6 font-mono text-[11px] text-muted-foreground/70">
                <div className="flex items-center gap-2">
                  <span>
                    {activeModule.loadStrategy === "instant"
                      ? "INSTANT"
                      : activeModule.loadStrategy === "eager"
                        ? "EAGER"
                        : "STREAMING"}
                  </span>
                </div>
                <span className="text-border">|</span>
                <span>{activeModule.id}</span>
                <span className="text-border">|</span>
                <span>:{activeModule.port}</span>
              </div>
              <div className="flex items-center gap-6 font-mono text-[11px] text-muted-foreground/70 whitespace-nowrap">
                <span className="hidden sm:inline">React 19</span>
                <span className="hidden text-border sm:inline">|</span>
                <span className="hidden sm:inline">Suspense</span>
                <span className="hidden text-border sm:inline">|</span>
                <span className="hidden sm:inline">Module Federation</span>
                <span className="hidden text-border sm:inline">|</span>
                <span>{THEME_DEFINITIONS[theme].label}</span>
                {Object.values(killed).some(Boolean) && (
                  <>
                    <span className="text-border">|</span>
                    <span className="text-destructive">
                      {Object.values(killed).filter(Boolean).length} KILLED
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="mx-auto max-w-screen-2xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
            <Routes>
              {MODULES.map((module) => (
                <Route
                  key={module.id}
                  path={module.path}
                  element={
                    <ModuleView
                      module={module}
                      isKilled={!!killed[module.id]}
                      onRendered={handleModuleRendered}
                    />
                  }
                />
              ))}
              <Route path="*" element={<Navigate to={DEFAULT_MODULE.path} replace />} />
            </Routes>
          </div>
        </main>

        <footer className="mt-auto border-t border-border">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between font-mono text-[10px] tracking-wider text-muted-foreground/70 uppercase">
              <span>Independent Deployment</span>
              <div className="flex items-center gap-4">
                <span>Hot Reload</span>
                <span className="text-ring">/</span>
                <span>Zero Coupling</span>
                <span className="text-ring">/</span>
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
      basename={process.env.BASE_PATH || "/"}
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
