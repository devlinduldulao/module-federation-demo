# Code Samples — Conference Reference

Annotated code snippets for projection during the talk. Each block is self-contained and presentation-ready.

> **Two pillars in this demo:**
> - **DX (Developer Experience)** — Module Federation gives growing teams independent builds, deploys, and onboarding. Sections 2, 4, 6, 7 show this.
> - **UX (User Experience)** — Suspense streaming + skeletons give visitors instant perceived load. Sections 1, 2 (layers), 8 show this.

---

## 1. The Streaming Resource Pattern (UX Pillar)

The entire pattern that makes Suspense work inside federated remotes:

```tsx
// StreamingMedicalRecords.tsx — 65 lines total, pattern is ~40

import MedicalRecords from "./MedicalRecords";

// Simulate a network fetch
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The Resource pattern — a synchronous read() that throws for Suspense
interface Resource<T> {
  read(): T;
}

function createResource<T>(asyncFn: () => Promise<T>): Resource<T> {
  let status: "pending" | "success" | "error" = "pending";
  let result: T;

  const suspender = asyncFn().then(
    (data) => { status = "success"; result = data; },
    (error) => { status = "error"; result = error; }
  );

  return {
    read() {
      if (status === "pending") throw suspender; // ← Suspense catches this!
      if (status === "error") throw result;
      return result;
    },
  };
}

// Cache so re-renders don't re-create the resource
const resourceCache = new Map<string, Resource<void>>();

function getResource(key: string, delayMs: number): Resource<void> {
  if (!resourceCache.has(key)) {
    resourceCache.set(key, createResource(() => delay(delayMs)));
  }
  return resourceCache.get(key)!;
}

// THE STREAMING WRAPPER — this is the only thing the shell imports
const StreamingMedicalRecords = () => {
  const resource = getResource("records-initial", 2500);
  resource.read(); // Throws a Promise while pending → triggers Suspense
  return <MedicalRecords />;
};

export default StreamingMedicalRecords;
```

---

## 1b. Why React 19 Doesn't Break This Pattern

React 19 changed Suspense: siblings in the **same** boundary render sequentially. But this architecture is immune:

```tsx
// ❌ VULNERABLE (React 19 waterfall) — two siblings in ONE boundary
<Suspense fallback={<Spinner />}>
  <MedicalRecords />          {/* suspends → blocks sibling */}
  <PrescriptionOrders />      {/* waits for Records to resolve */}
</Suspense>

// ✅ THIS DEMO — route-based, separate boundaries, no siblings
<Routes>
  <Route path="/records" element={
    <ErrorBoundary>           {/* own error boundary */}
      <Suspense fallback={<RecordsSkeleton />}>  {/* own suspense */}
        <MedicalRecords />     {/* only component in this boundary */}
      </Suspense>
    </ErrorBoundary>
  } />
  <Route path="/prescriptions" element={
    <ErrorBoundary>
      <Suspense fallback={<PrescriptionsSkeleton />}>
        <StreamingPrescriptionOrders />
      </Suspense>
    </ErrorBoundary>
  } />
</Routes>
```

**React 19 benefits:**

```tsx
// createResource already follows "render-as-you-fetch" (React 19 best practice)
const resource = getResource("records-initial", 2500);  // ← hoisted outside component

const StreamingMedicalRecords = () => {
  resource.read();  // just reads — doesn't initiate fetch
  return <MedicalRecords />;
};

// Optional future migration to use() hook (React 19 first-class API):
const StreamingMedicalRecords = () => {
  use(resource.promise);  // replaces throw-promise pattern
  return <MedicalRecords />;
};
```

| React 19 Feature | Benefit |
|-----------------|---------|
| **Suspense batching (19.2+)** | Skeleton → content transitions grouped in single render pass |
| **Compiler optimizations** | Shell re-renders (theme, palette, kills) skip unchanged paths |
| **`use()` hook** | First-class replacement for throw-promise (migration optional) |

---

## 2. Shell Composition — Loading Strategies + Three Layers of Resilience (DX + UX)

```tsx
// packages/shell/src/App.tsx

// ---------------------------------------------------------------------------
// Loading strategies — not every module should load the same way:
//   INSTANT:  Home     — lazy for code splitting, no streaming delay
//   EAGER:    Records — standalone component, preloaded on shell mount
//   STREAMED: Prescriptions, Analytics — loaded on demand with skeletons
// ---------------------------------------------------------------------------

// INSTANT — Home renders the moment the chunk arrives
const Home = lazy(() =>
  import("home/Home").catch((error) => {
    console.error("Failed to load:", error);
    return {
      default: () => (
        <ModuleFallback
          title="Home Module Unavailable"
          message="The home service is currently unavailable."
        />
      ),
    };
  })
);

// EAGER — preloaded on shell mount via EAGER_PRELOAD, no streaming delay
const MedicalRecords = lazy(() =>
  import("records/MedicalRecords").catch((error) => {
    /* ... fallback ... */
  })
);

// STREAMED — loaded on demand with skeleton fallbacks
const StreamingPrescriptionOrders = lazy(() =>
  import("prescriptions/StreamingPrescriptionOrders").catch((error) => {
    /* ... fallback ... */
  })
);

// Each module declares its loading strategy
type LoadStrategy = "instant" | "eager" | "streamed";

const MODULES = [
  { id: "home",      component: Home,                     loadStrategy: "instant"  },
  { id: "records",   component: MedicalRecords,                  loadStrategy: "eager"    },
  { id: "prescriptions", component: StreamingPrescriptionOrders,   loadStrategy: "streamed" },
  { id: "analytics",     component: StreamingClinicalAnalytics,    loadStrategy: "streamed" },
];

// Eagerly preload modules marked as "eager" at shell init time
const EAGER_MODULES = MODULES.filter((m) => m.loadStrategy === "eager");
for (const m of EAGER_MODULES) { PREFETCHERS[m.id](); }

// All modules still get three layers of resilience:
function ModuleView({ module, isKilled }: { module: ModuleConfig; isKilled: boolean }) {
  const Component = module.component;

  // Kill switch — Federation Lab can simulate a remote going down
  if (isKilled) {
    return (
      <ModuleFallback
        title={`${module.label} Module Killed`}
        message={`This remote has been intentionally taken down via the demo kill switch.`}
      />
    );
  }

  return (
    <ErrorBoundary>                           {/* Layer 3: catches runtime errors */}
      <Suspense fallback={<RecordsSkeleton />}> {/* Layer 2: shows skeleton */}
        <Component />                            {/* Layer 1: lazy-loaded remote */}
      </Suspense>
    </ErrorBoundary>
  );
}
```

### Microservices vs Micro-frontends — the isolation model

"Is this like microservices?" — **yes, for the 99% case.**

| | Microservices | Micro-frontends (this demo) |
|---|---|---|
| **Isolation** | OS-level (separate processes) | React-level (`ErrorBoundary` per module) |
| **If one crashes** | Other services keep running | Other modules keep rendering |
| **Blast radius** | Network call fails → caller handles | `import()` fails → `ModuleFallback` + Retry |
| **Shared risk** | None (own memory/CPU) | Shared browser tab |

The three layers above (`.catch()` on `lazy()`, `Suspense`, `ErrorBoundary`) give you microservice-style fault isolation for crashes, network failures, and bad deploys. The one gap: all modules share a browser tab, so an infinite loop or memory leak in one remote *can* freeze the whole page. The fix (`<iframe>` isolation) breaks shared React context — most teams accept the tradeoff.

---

## 3. Cross-Module Communication (DX Pillar)

Zero imports between modules — teams never depend on each other's code.

### Producer (Records module)

```tsx
// When user clicks "Prescribe"
const handleAddPrescription = (record: MedicalRecord) => {
  // Tell the prescriptions module
  window.dispatchEvent(new CustomEvent("addPrescription", {
    detail: {
      id: record.id,
      name: record.name,
      price: record.price,
      quantity: 1,
    },
  }));

  // Tell the shell to show a toast
  window.dispatchEvent(new CustomEvent("showNotification", {
    detail: {
      type: "success",
      message: `${record.name} prescription created`,
    },
  }));
};
```

### Consumer (Prescriptions module)

```tsx
// Prescriptions module listens for addPrescription events
useEffect(() => {
  const handleAddPrescription = (event: AddPrescriptionEvent) => {
    const item = event.detail;
    setPrescriptionItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  window.addEventListener("addPrescription", handleAddPrescription);
  return () => window.removeEventListener("addPrescription", handleAddPrescription);
}, []);
```

### Host-owned navigation request (Prescriptions module)

```tsx
// Empty prescriptions CTA asks the shell to navigate instead of importing react-router-dom
const handleBrowseRecords = () => {
  window.dispatchEvent(
    new CustomEvent("navigateToModule", {
      detail: { module: "records" },
    })
  );
};
```

---

## 4. Module Federation Config (DX Pillar)

This is the infrastructure that lets each team own their own build, deploy, and dev server.

Each `rspack.config.js` has standard bundler settings (`entry`, `module.rules`, `devServer`, `optimization`). **The one property that turns separate apps into a federated architecture** is the `ModuleFederationPlugin` — and specifically three sub-properties:

```
┌─────────────────────────────────────────────────────────────┐
│  ModuleFederationPlugin — the ONLY micro-frontend property  │
├─────────────────────┬────────────────┬─────────────────────┤
│ exposes (remotes)   │ remotes (host) │ shared (both)       │
│ “What do I share?”  │ “Where are    │ “What do we         │
│ = team’s public API │  they?”        │  deduplicate?”      │
│                     │ = runtime     │ = singleton: true   │
│                     │   discovery   │   = one React       │
└─────────────────────┴────────────────┴─────────────────────┘
```

> Remove the `ModuleFederationPlugin`, and you have five normal, unrelated apps. Add it back, and they become a federated architecture. Everything else in each config file is standard Rspack.

### Remote (exposes modules)

```js
// packages/records/rspack.config.js
new rspack.container.ModuleFederationPlugin({
  name: "records",
  filename: "remoteEntry.js",
  exposes: {
    "./MedicalRecords":          "./src/MedicalRecords.tsx",
    "./StreamingMedicalRecords": "./src/StreamingMedicalRecords.tsx",
  },
  shared: {
    react:       { singleton: true, requiredVersion: "^19.2.5" },
    "react-dom": { singleton: true, requiredVersion: "^19.2.5" },
  },
});
```

### Host (consumes remotes)

```js
// packages/shell/rspack.config.js
new rspack.container.ModuleFederationPlugin({
  name: "shell",
  remotes: {
    home:      "home@http://localhost:3004/remoteEntry.js",
    records:  "records@http://localhost:3001/remoteEntry.js",
    prescriptions:      "prescriptions@http://localhost:3002/remoteEntry.js",
    analytics: "analytics@http://localhost:3003/remoteEntry.js",
  },
  shared: {
    react:              { singleton: true },
    "react-dom":        { singleton: true },
    "react-dom/client": { singleton: true },
  },
});
```

---

## 5. Theme System

### Shell — theme owner

```tsx
// packages/shell/src/lib/theme.ts

export function applyTheme(theme: ThemeName): void {
  const definition = THEME_DEFINITIONS[theme];
  const root = document.documentElement;

  // Apply CSS variables
  root.dataset.theme = theme;
  for (const [variable, value] of Object.entries(definition.variables)) {
    root.style.setProperty(variable, value);
  }

  // Expose bridge for remotes
  window.__MF_THEME__ = {
    getTheme: () => theme,
    setTheme: (next) => applyTheme(next),
  };

  // Persist
  localStorage.setItem("mf-demo-theme", theme);

  // Broadcast to all remotes
  window.dispatchEvent(new CustomEvent("themeChange", {
    detail: { theme, colorScheme: definition.colorScheme },
  }));
}
```

### Remote — theme consumer

```tsx
// packages/records/src/lib/theme.ts

export function useActiveTheme() {
  const [theme, setTheme] = useState<ThemeName>(() => {
    // Try host bridge first, fallback to localStorage
    return window.__MF_THEME__?.getTheme() ?? "dark";
  });

  useEffect(() => {
    const handler = (e: WindowEventMap["themeChange"]) => {
      setTheme(e.detail.theme);
    };
    window.addEventListener("themeChange", handler);
    return () => window.removeEventListener("themeChange", handler);
  }, []);

  return { theme, label: THEME_LABELS[theme] };
}
```

---

## 6. Typed Event Contracts

```tsx
// packages/records/src/types.ts

export interface AddPrescriptionEvent extends CustomEvent {
  detail: {
    readonly id: number;
    readonly name: string;
    readonly price: number;
    readonly quantity: number;
  };
}

export interface ThemeChangeEvent extends CustomEvent {
  detail: {
    theme: "dark" | "light";
    colorScheme: "dark" | "light";
  };
}

// Augment the global WindowEventMap — no shared package needed
declare global {
  interface WindowEventMap {
    addPrescription: AddPrescriptionEvent;
    navigateToModule: CustomEvent<{ module: "home" | "records" | "prescriptions" | "analytics" }>;
    showNotification: NotificationEvent;
    themeChange: ThemeChangeEvent;
  }
}
```

---

## 7. Testing Federated Components (DX Pillar)

Each team tests their module in complete isolation — no dev servers needed, no cross-team dependencies.

### Vitest config — the alias trick

```ts
// vitest.config.ts
resolve: {
  alias: {
    // Resolve MF remote imports to actual source files
    "home/Home": path.resolve(
      __dirname, "packages/home/src/Home.tsx"
    ),
    "records/MedicalRecords": path.resolve(
      __dirname, "packages/records/src/MedicalRecords.tsx"
    ),
    "prescriptions/StreamingPrescriptionOrders": path.resolve(
      __dirname, "packages/prescriptions/src/StreamingPrescriptionOrders.tsx"
    ),
    "analytics/StreamingClinicalAnalytics": path.resolve(
      __dirname, "packages/analytics/src/StreamingClinicalAnalytics.tsx"
    ),
    // Pin React to one copy
    react: path.join(rootNodeModules, "react"),
    "react-dom": path.join(rootNodeModules, "react-dom"),
  },
}
```

### Component test — event verification

```tsx
it("dispatches addPrescription event on Add click", async () => {
  const handler = vi.fn();
  window.addEventListener("addPrescription", handler);

  render(<MedicalRecords />);
  await user.click(
    screen.getByRole("button", { name: /create prescription for Sarah Chen to prescriptions/i })
  );

  expect(handler).toHaveBeenCalledTimes(1);
  expect(handler.mock.calls[0][0].detail).toEqual({
    id: 1,
    name: "Sarah Chen prescription",
    price: 2499.99,
    quantity: 1,
  });

  window.removeEventListener("addPrescription", handler);
});
```

---

## 8. Prefetching + Eager Loading

```tsx
// Two-tier preloading: eager on mount + hover on demand
const PREFETCHERS: Record<ModuleType, () => Promise<unknown>> = {
  home:      () => import("home/Home").catch(() => undefined),
  records:       () => import("records/MedicalRecords").catch(() => undefined),
  prescriptions: () => import("prescriptions/StreamingPrescriptionOrders").catch(() => undefined),
  analytics:     () => import("analytics/StreamingClinicalAnalytics").catch(() => undefined),
};

// EAGER — preload on shell mount (fires at module evaluation time)
const EAGER_MODULES = MODULES.filter((m) => m.loadStrategy === "eager");
for (const m of EAGER_MODULES) { PREFETCHERS[m.id](); }

// HOVER — trigger on hover for remaining modules
<NavLink
  to={module.path}
  onMouseEnter={() => PREFETCHERS[module.id]()}
>
  {module.label}
</NavLink>
```

| Strategy | When it loads | Example |
|----------|--------------|----------|
| **Instant** | Chunk fetched lazily, no streaming delay | Home |
| **Eager** | Preloaded the moment the shell mounts, no streaming delay | Records |

> **Why `lazy()` for eager modules?** Module Federation remotes are separate builds on separate servers — you can't use a static `import`. The eager pattern fires `import()` at shell init to warm the browser's module cache; when `lazy()` later calls the same `import()`, it resolves instantly. This is confirmed by the test: *"renders records immediately without a skeleton (eager strategy)"*.
| **Hover** | Prefetched when user hovers a tab | Prescriptions, Analytics |

---

## 9. Shell Controls Implementation

Three control surfaces in the shell header — each built with a different pattern:

### Settings — Theme propagation via CSS variables + events

```typescript
// lib/theme.ts — applyTheme() is the single entry point for ALL theme changes
export function applyTheme(theme: ThemeName): void {
  const definition = THEME_DEFINITIONS[theme];  // label, description, CSS vars
  const root = document.documentElement;

  // 1. Set data attribute + color scheme (CSS can target [data-theme="dark"])
  root.dataset.theme = theme;
  root.style.colorScheme = definition.colorScheme;

  // 2. Rewrite every CSS custom property — this is how remotes update instantly
  for (const [variable, value] of Object.entries(definition.variables)) {
    root.style.setProperty(variable, value);
  }

  // 3. Expose a bridge on window so remotes can read/set without importing shell
  window.__MF_THEME__ = {
    getTheme: () => theme,
    setTheme: (next) => applyTheme(next),
  };

  // 4. Persist to localStorage (survives refresh)
  localStorage.setItem(THEME_STORAGE_KEY, theme);

  // 5. Broadcast typed event (remotes listening via useActiveTheme() react)
  window.dispatchEvent(
    new CustomEvent("themeChange", {
      detail: { theme, colorScheme: definition.colorScheme },
    })
  );
}
```

> **Key insight:** Remotes never import shell code. They style with Tailwind classes that reference CSS variables (`text-cream`, `bg-noir`). When the shell rewrites those variables, every remote re-paints automatically — zero coupling.

### Commands — Data-driven command palette

```tsx
// App.tsx — commands are generated from module config + hook state
const commandActions = useMemo<readonly CommandAction[]>(() => {
  // Navigation: one command per module from the MODULES config array
  const nav = MODULES.map((m) => ({
    id: `goto-${m.id}`,
    title: `Switch to ${m.label}`,
    keywords: `${m.id} ${m.label.toLowerCase()} module ${m.port}`,
    run: () => { navigate(m.path); setIsCommandPaletteOpen(false); },
  }));

  // Theme: one per THEME_OPTIONS
  const themes = THEME_OPTIONS.map((t) => ({
    id: `theme-${t}`,
    title: `Apply ${THEME_DEFINITIONS[t].label} Theme`,
    run: () => { handleThemeChange(t); setIsCommandPaletteOpen(false); },
  }));

  // Demo: kill/restore per module + deployment ring toggle
  const demo = [
    { id: "demo-panel", title: "Open Federation Lab", run: () => setIsDemoPanelOpen(true) },
    ...MODULES.map((m) => ({
      id: `kill-${m.id}`,
      title: `${killed[m.id] ? "Restore" : "Kill"} ${m.label} Remote`,
      run: () => toggleKill(m.id),
    })),
  ];

  return [...nav, ...themes, ...demo];
}, [navigate, killed, variant]);

// Filtering: simple case-insensitive substring match
const filtered = useMemo(() => {
  const q = commandQuery.trim().toLowerCase();
  if (!q) return commandActions;
  return commandActions.filter((c) =>
    `${c.title} ${c.subtitle} ${c.keywords}`.toLowerCase().includes(q)
  );
}, [commandActions, commandQuery]);
```

> **Pattern:** Commands are pure data (`{ id, title, keywords, run }`). The palette UI is generic and reusable — it doesn't know about modules, themes, or kill switches. Adding a new command means adding one object to the array.

### Lab — Three hooks compose the Federation Lab

```typescript
// lib/health.ts — useRemoteHealth: polls remoteEntry.js via HEAD request
async function checkRemote(port: string) {
  const start = performance.now();
  try {
    const res = await fetch(`http://localhost:${port}/remoteEntry.js`, {
      method: "HEAD", mode: "no-cors", cache: "no-store",
    });
    return { ok: res.ok || res.type === "opaque", latencyMs: Math.round(performance.now() - start) };
  } catch {
    return { ok: false, latencyMs: Math.round(performance.now() - start) };
  }
}

// Polls every 5s, only when `enabled` is true (panel is open)
export function useRemoteHealth(remotes, enabled) {
  // ...runs Promise.all(remotes.map(checkRemote)) on an interval
  // Returns: readonly RemoteHealth[] with { id, port, status, latencyMs }
}
```

```typescript
// lib/demo.ts — useKillSwitch: client-side fault simulation
export function useKillSwitch(moduleIds: readonly string[]) {
  const [killed, setKilled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(moduleIds.map((id) => [id, false]))
  );
  const toggle = useCallback((id) =>
    setKilled((prev) => ({ ...prev, [id]: !prev[id] })), []);
  const killAll = useCallback(() => /* set all to true */, []);
  const restoreAll = useCallback(() => /* set all to false */, []);
  return { killed, toggle, killAll, restoreAll };
}
```

```typescript
// lib/demo.ts — useVersionRegistry: A/B deployment ring with mock data
export function useVersionRegistry(moduleIds: readonly string[]) {
  const [variant, setVariant] = useState<"stable" | "canary">("stable");
  const versions = useMemo(() => {
    const registry = variant === "stable" ? MOCK_VERSIONS : CANARY_VERSIONS;
    return moduleIds.map((id) => registry[id]!);
  }, [moduleIds, variant]);
  const toggleVariant = useCallback(() =>
    setVariant((p) => p === "stable" ? "canary" : "stable"), []);
  return { variant, versions, toggleVariant };
}
```

```tsx
// App.tsx — ModuleView checks kill state before rendering
function ModuleView({ module, isKilled }) {
  if (isKilled) {
    return <ModuleFallback title={`${module.label} Module Killed`} />;
  }
  return (
    <ErrorBoundary>
      <Suspense fallback={<ModuleSkeleton />}>
        <module.component />
      </Suspense>
    </ErrorBoundary>
  );
}
```

> **Architecture:** The three hooks (`useRemoteHealth`, `useKillSwitch`, `useVersionRegistry`) live in `lib/` and are consumed by `ShellFrame` in `App.tsx`. `DemoPanel.tsx` is a pure presentation component — it receives all state as props and fires callback props for mutations. Zero business logic in the panel itself.
