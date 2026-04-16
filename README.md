# Module Federation Demo

A micro-frontend architecture demo built with **Rspack Module Federation**, **React 19**, **TypeScript**, and **Tailwind CSS v4**. Five independent applications compose into a single shell — each deployable, scalable, and maintainable on its own.

Built for conference talks and technical demonstrations.

## Architecture

```
Shell (host)           localhost:3000
├── Home (remote)      localhost:3004   → INSTANT  (Home — no streaming delay)
├── Records (remote)  localhost:3001   → EAGER    (MedicalRecords — preloaded on shell mount)
├── Prescriptions (remote)      localhost:3002   → STREAMED (StreamingPrescriptionOrders — on demand)
└── Analytics (remote) localhost:3003   → STREAMED (StreamingClinicalAnalytics — on demand)
```

Each remote exposes both a **Streaming** component (wraps a Resource-based Suspense pattern to simulate network delay) and a **Standalone** component (renders immediately). The shell chooses which to import based on **three loading strategies** and content priority:

| Strategy | Module | Behavior |
|----------|--------|----------|
| **Instant** | Home | Lazy-loaded for code splitting, but imports the standalone component directly — no streaming delay. Renders the moment the chunk arrives. |
| **Eager** | Records | Imports the standalone component directly and preloads the chunk on shell mount — already cached before the user clicks. No skeleton, no streaming delay. Still uses `lazy()` because Module Federation remotes are separate builds resolved at runtime via `import()` — you can't use a static `import`. The eager `import()` fires at shell init and warms the cache; `lazy()` resolves from it instantly. |
| **Streamed** | Prescriptions, Analytics | Loaded on demand with per-module skeleton fallbacks and `<ErrorBoundary>` for fault isolation. |

All modules are wrapped in `<Suspense>` with per-module skeleton fallbacks and `<ErrorBoundary>` for fault isolation. The shell owns URL-based navigation, so `/`, `/records`, `/prescriptions`, and `/analytics` are directly shareable routes. The status strip shows the active module's loading strategy (INSTANT / EAGER / STREAMING) with a color-coded indicator.

The root route `/` renders the **Home** landing page, which provides an overview of the architecture and navigation cards to each module. Unknown routes redirect to `/`.

## Quick Start

```bash
# Install everything (root + all 4 packages)
npm install

# Confirm the demo ports are available before starting the federation
npm run ports:check

# Start all four dev servers concurrently
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The shell renders the Home landing page at `/` and pulls remote entry points from ports 3001–3004.

If `npm run dev` fails, the most common cause is that one of the demo ports is already occupied. `npm run ports:check` now reports that clearly before you start the full stack.

### Quality Checks

```bash
# Lint every package
npm run lint

# Run TypeScript checks across the workspace
npm run typecheck

# Run all tests or one package suite
npm test
npm run test:shell
npm run test:records
npm run test:prescriptions
npm run test:analytics
```

### Run a single package

```bash
cd packages/home && npm run dev       # :3004
cd packages/records && npm run dev        # :3001
cd packages/prescriptions && npm run dev  # :3002
cd packages/analytics && npm run dev      # :3003
cd packages/shell && npm run dev      # :3000
```

Each remote runs standalone at its own port with its own `index.html`.

### Prefetching + Eager Loading

The shell uses a **two-tier preloading strategy**:

1. **Eager preload** — modules with `loadStrategy: "eager"` (Records) are preloaded the moment the shell mounts, so their chunks and streaming data are likely cached before the user navigates.
2. **Hover prefetch** — remaining modules are prefetched when the user hovers a navigation tab, using a `PREFETCHERS` map of bare `import()` calls.

## Project Structure

```
module-federation-demo/
├── eslint.config.mjs                  # Shared ESLint flat config
├── package.json                       # Workspace scripts (concurrently)
└── packages/
    ├── shell/                         # Host application
    │   ├── rspack.config.js           # MF remotes config
    │   ├── src/
    │   │   ├── App.tsx                # Navigation, Suspense orchestration
    │   │   ├── App.test.tsx           # Shell integration tests
    │   │   ├── bootstrap.tsx          # createRoot entry
    │   │   ├── index.css              # Design system tokens + animations
    │   │   ├── types.d.ts             # Remote module declarations
    │   │   └── components/
    │   │       ├── ErrorBoundary.tsx   # Per-module error isolation
    │   │       ├── ModuleFallback.tsx  # Offline module placeholder
    │   │       ├── DemoPanel.tsx       # Federation Lab demo controls
    │   │       ├── LoadingSpinner.tsx  # Generic loading dots
    │   │       ├── HomeSkeleton.tsx
    │   │       ├── RecordsSkeleton.tsx
    │   │       ├── PrescriptionsSkeleton.tsx
    │   │       └── AnalyticsSkeleton.tsx
    │   └── lib/
    │       ├── theme.ts               # Theme registry, persistence, window bridge
    │       ├── health.ts              # Remote health monitoring (useRemoteHealth)
    │       ├── demo.ts                # Kill switch + version registry hooks
    │       └── utils.ts               # cn() — clsx + tailwind-merge
    ├── home/                          # Remote — landing page
    │   ├── rspack.config.js           # MF exposes config
    │   └── src/
    │       ├── Home.tsx               # Landing page with architecture overview
    │       ├── StreamingHome.tsx      # Suspense-wrapped
    │       ├── types.ts
    │       └── lib/utils.ts           # cn() utility
    ├── records/                      # Remote — medical records
    │   ├── rspack.config.js           # MF exposes config
    │   └── src/
    │       ├── MedicalRecords.tsx     # Standalone version
    │       ├── MedicalRecords.test.tsx
    │       ├── StreamingMedicalRecords.tsx  # Suspense-wrapped
    │       ├── types.ts
    │       └── lib/utils.ts           # cn() utility
    ├── prescriptions/                          # Remote — prescription orders
    │   ├── rspack.config.js
    │   └── src/
    │       ├── PrescriptionOrders.tsx
    │       ├── PrescriptionOrders.test.tsx
    │       ├── StreamingPrescriptionOrders.tsx
    │       ├── types.ts
    │       └── lib/utils.ts           # cn() utility
    └── analytics/                     # Remote — clinical analytics
        ├── rspack.config.js
        └── src/
            ├── ClinicalAnalytics.tsx
            ├── ClinicalAnalytics.test.tsx
            ├── StreamingClinicalAnalytics.tsx
            ├── types.ts
            └── lib/utils.ts           # cn() utility
```

## Tech Stack

| Tool | Version | Role |
|------|---------|------|
| React | ^19.2.5 | UI library |
| TypeScript | ^6.0.2 | Type safety |
| Rspack | ^1.7.11 | Bundler + Module Federation |
| Tailwind CSS | v4 | Utility-first CSS via `@theme` |
| PostCSS | ^8.5.10 | CSS pipeline (`@tailwindcss/postcss`) |
| Vitest | ^4.1.4 | Unit + component testing |
| concurrently | ^9.2.1 | Dev server orchestration |

## Design System — "Noir Editorial"

A typographic editorial design language that avoids generic pastel AI aesthetics. The default presentation is dark, and the shell can switch between `dark` and `light` palettes by updating shared CSS custom properties at runtime.

### Typography

| Role | Font | Usage |
|------|------|-------|
| Display | Instrument Serif | Headlines, large numbers (italic) |
| Body | DM Sans | Paragraphs, UI text |
| Technical | IBM Plex Mono | Labels, prices, metadata, navigation |

### Color Tokens

The values below are the default dark theme tokens. The shell persists the active theme in `localStorage` under `mf-demo-theme` and rewrites these CSS variables when the user changes themes.

| Token | Hex | Usage |
|-------|-----|-------|
| `noir` | `#0C0C0C` | Canvas / page background |
| `surface` | `#141414` | Hover / elevated cards |
| `elevated` | `#1C1C1C` | Skeleton placeholders |
| `edge` | `#2E2E2E` | Borders, 1px grid dividers |
| `cream` | `#FAFAF9` | Primary text |
| `stone` | `#A8A29E` | Secondary text |
| `dim` | `#6B6560` | Tertiary / disabled text |
| `citrine` | `#D4FF00` | Primary accent — CTAs, active nav |
| `mint` | `#34D399` | Success states |
| `ice` | `#60A5FA` | Info / cool data |
| `burnt` | `#FF6B35` | Warnings / warm accent |
| `rose` | `#F87171` | Errors / destructive |

### Key Visual Patterns

- **1px grid gaps** — `gap-[1px] bg-edge` creates sharp editorial grid lines
- **Mono uppercase labels** — `font-mono text-[11px] tracking-[0.3em] uppercase`
- **Serif italic headings** — `font-display italic` for display type
- **Citrine underline navigation** — active tab gets a 2px citrine bottom bar
- **Noise grain overlay** — subtle SVG noise on `body::after`
- **Staggered entry animations** — `fadeInUp` with incremental `animationDelay`

## Module Federation Setup

Each `rspack.config.js` is a standard Rspack configuration — `entry`, `module.rules`, `devServer`, `optimization`, `resolve` are all normal bundler settings that any app would have. **The only property that transforms separate apps into a federated architecture** is the `ModuleFederationPlugin` inside `plugins`, and specifically these three sub-properties:

| Property | Defined on | What it does |
|----------|-----------|-------------|
| **`exposes`** | Remotes | Declares the module's public API — which components other apps can import. This is the **contract** between teams. |
| **`remotes`** | Host (shell) | Tells the host where to find each remote's `remoteEntry.js` at runtime. Format: `scope@URL`. This is the **runtime discovery mechanism**. |
| **`shared`** | Both | Declares which dependencies should be deduplicated across the federation. `singleton: true` on React ensures one instance — without it, each remote loads its own React and hooks break. |

```
Remote (records :3001)              Shell (host :3000)
┌──────────────────────┐            ┌──────────────────────┐
│ exposes:             │            │ remotes:             │
│   ./MedicalRecords ──┼──remoteEntry.js──┼─► records@:3001│
│                      │            │                      │
│ shared:              │            │ shared:              │
│   react: singleton ──┼────────────┼─► react: singleton   │
│                      │            │   (one copy for all) │
└──────────────────────┘            └──────────────────────┘
```

Everything else in the config is standard Rspack. Remove the `ModuleFederationPlugin`, and you have five normal, unrelated apps. Add it back, and they become a federated architecture.

### Shell (Host)

```js
// rspack.config.js — shell
new rspack.container.ModuleFederationPlugin({
  name: "shell",
  remotes: {
    home:     "home@http://localhost:3004/remoteEntry.js",
    records: "records@http://localhost:3001/remoteEntry.js",
    prescriptions:     "prescriptions@http://localhost:3002/remoteEntry.js",
    analytics:"analytics@http://localhost:3003/remoteEntry.js",
  },
  shared: {
    react:              { singleton: true, strictVersion: false },
    "react-dom":        { singleton: true, strictVersion: false },
    "react-dom/client": { singleton: true, strictVersion: false },
  },
});
```

### Remote (example: records)

```js
// rspack.config.js — records
new rspack.container.ModuleFederationPlugin({
  name: "records",
  filename: "remoteEntry.js",
  exposes: {
    "./MedicalRecords":          "./src/MedicalRecords.tsx",
    "./StreamingMedicalRecords": "./src/StreamingMedicalRecords.tsx",
  },
  shared: { react: { singleton: true }, "react-dom": { singleton: true } },
});
```

## Inter-Module Communication

Modules communicate through typed `CustomEvent` dispatch on `window`:

```typescript
// Records → Prescriptions: add item
window.dispatchEvent(
  new CustomEvent("addPrescription", {
    detail: { id: 1, name: "Sarah Chen", price: 999.99, quantity: 1 },
    bubbles: true,
  })
);

// Any module → Shell: trigger notification toast
window.dispatchEvent(
  new CustomEvent("showNotification", {
    detail: { type: "success", message: "Prescription created" },
  })
);

// Shell: notify on tab change
window.dispatchEvent(
  new CustomEvent("moduleChange", {
    detail: { newModule: "prescriptions" },
  })
);

// Remote -> Shell: request host-owned navigation without importing the router
window.dispatchEvent(
  new CustomEvent("navigateToModule", {
    detail: { module: "records" },
  })
);

// Shell: broadcast a theme change to remotes
window.dispatchEvent(
  new CustomEvent("themeChange", {
    detail: { theme: "light", colorScheme: "light" },
  })
);
```

Events are typed in each package's `types.ts` via `WindowEventMap` augmentation:

```typescript
export interface AddPrescriptionEvent extends CustomEvent {
  detail: PrescriptionItem;
}

declare global {
  interface WindowEventMap {
    addPrescription: AddPrescriptionEvent;
    navigateToModule: CustomEvent<{ module: "home" | "records" | "prescriptions" | "analytics" }>;
    showNotification: NotificationEvent;
    themeChange: ThemeChangeEvent;
  }
}
```

The shell also exposes `window.__MF_THEME__` so remotes can read or update the active theme without importing host-only shell code.

## Shell Controls

The shell header exposes three control surfaces — **Settings**, **Commands**, and **Lab** — that serve distinct purposes during both development and live presentations. Each opens as a slide-over panel or overlay.

### Settings (Appearance Drawer)

**Purpose:** Shell-owned theme control with live persistence and cross-module broadcasting.

Click the **Settings** button in the header to open a slide-over drawer from the right. It provides:

- **Theme selection** — toggle between Dark and Light palettes. Each option shows a description and an "Active" / "Available" badge.
- **Live propagation** — selecting a theme immediately rewrites CSS custom properties on `:root`, persists the choice in `localStorage` under `mf-demo-theme`, and dispatches a typed `themeChange` event on `window`. All remotes react without a page refresh.
- **Persistence indicator** — the drawer footer confirms the `localStorage` key being used.

**Why it matters for the demo:** This proves that the shell can own shared UI state (theme) and broadcast changes across independently deployed remotes through CSS variables and events — no shared imports, no prop drilling across module boundaries.

The header also includes an inline **Dark / Light** toggle for quick switching without opening the full drawer.

**Implementation (`lib/theme.ts` + `App.tsx` + `SettingsDrawer`):**

The theme system is built on three layers:

1. **Theme registry** — `THEME_DEFINITIONS` maps each theme name to a label, description, color scheme, and a complete set of CSS custom property values. Adding a new theme means adding one entry here.

2. **`applyTheme()` function** — the single entry point for all theme changes. It:
   - Sets `data-theme` and `color-scheme` on `<html>` so CSS can target the active theme
   - Iterates `definition.variables` and calls `root.style.setProperty()` for each token — this is how every remote's Tailwind classes update instantly
   - Exposes `window.__MF_THEME__` (a getter/setter bridge) so remotes can read or change the theme without importing shell code
   - Persists to `localStorage` (wrapped in try/catch for private browsing)
   - Dispatches a typed `themeChange` CustomEvent so remotes listening via `useActiveTheme()` can react

3. **Shell state** — `App.tsx` holds `theme` in `useState`, calls `applyTheme(theme)` in a `useEffect`, and listens for `StorageEvent` to sync theme changes across browser tabs. The `SettingsDrawer` component is a `memo`-wrapped overlay that receives `theme` and `onSelectTheme` as props — pure presentation, no side effects.

```typescript
// lib/theme.ts — core propagation
export function applyTheme(theme: ThemeName): void {
  const definition = THEME_DEFINITIONS[theme];
  const root = document.documentElement;

  root.dataset.theme = theme;
  root.style.colorScheme = definition.colorScheme;

  for (const [variable, value] of Object.entries(definition.variables)) {
    root.style.setProperty(variable, value);  // ← every remote's CSS reacts
  }

  window.__MF_THEME__ = {                    // ← remote bridge
    getTheme: () => theme,
    setTheme: (next) => applyTheme(next),
  };

  localStorage.setItem(THEME_STORAGE_KEY, theme);

  window.dispatchEvent(                      // ← event contract
    new CustomEvent("themeChange", {
      detail: { theme, colorScheme: definition.colorScheme },
    })
  );
}
```

### Commands (Command Palette)

**Purpose:** A keyboard-first command palette (VS Code–style) for navigating, theming, and controlling the demo without touching the mouse.

Press **Ctrl+K** (or **Cmd+K** on Mac), or click the **Commands** button to open a search overlay. It provides:

- **Navigation commands** — "Switch to Records", "Switch to Prescriptions", etc. Each shows the module name and port number.
- **Theme commands** — "Apply Dark Theme", "Apply Light Theme" with descriptions.
- **Demo commands** — "Open Federation Lab", "Kill/Restore \<module\> Remote", "Switch to Canary/Stable Ring".
- **Fuzzy search** — type any keyword (module name, port, "kill", "canary", "dark") and the list filters in real time.
- **Keyboard dismiss** — press Esc to close.

**Why it matters for the demo:** During a live talk, the speaker can control the entire demo from the keyboard — navigate between modules, kill remotes, toggle themes, and switch deployment rings — without hunting for buttons. It also demonstrates that shell-level orchestration features (kill switch, version registry) are accessible from multiple surfaces: the Lab panel, the command palette, and the status strip.

**Implementation (`App.tsx` — `CommandPalette` + `commandActions`):**

The command palette is a `memo`-wrapped overlay component that receives a `commands` array and a `query` string as props. The actual command definitions are built in `ShellFrame` via `useMemo`:

1. **Command generation** — `commandActions` is a memoized array built from three sources:
   - **Navigation commands** — one per module, generated from the `MODULES` config array. Each calls `navigate(module.path)` and closes the palette.
   - **Theme commands** — one per theme option, generated from `THEME_OPTIONS`. Each calls `handleThemeChange()`.
   - **Demo commands** — "Open Federation Lab", per-module kill/restore toggles (label flips based on `killed[id]`), and a deployment ring toggle (label flips based on `variant`).

2. **Filtering** — `filteredCommands` is a `useMemo` that runs a case-insensitive substring match against each command's `title + subtitle + keywords` string. The `keywords` field contains aliases (e.g., "module navigation 3001") so searching by port number or concept works.

3. **Keyboard binding** — a `keydown` listener in `ShellFrame` catches `Ctrl+K` / `Cmd+K` to open, `Escape` to close. The query resets to empty when the palette closes.

4. **Component structure** — the `CommandPalette` component renders a backdrop, a search input (auto-focused via `useRef`), and a scrollable list of command buttons. Each button calls `command.run()` which performs the action and closes the palette.

```tsx
// Command definition — every action is data-driven
const commandActions = useMemo<readonly CommandAction[]>(() => {
  const navigationCommands = MODULES.map((module) => ({
    id: `goto-${module.id}`,
    title: `Switch to ${module.label}`,
    subtitle: `Load the ${module.label.toLowerCase()} micro-frontend on port ${module.port}`,
    keywords: `${module.id} ${module.label.toLowerCase()} module navigation ${module.port}`,
    run: () => { navigate(module.path); setIsCommandPaletteOpen(false); },
  }));

  const demoCommands: CommandAction[] = [
    {
      id: "demo-panel",
      title: "Open Federation Lab",
      keywords: "demo lab federation health kill fault isolation version canary",
      run: () => { setIsDemoPanelOpen(true); setIsCommandPaletteOpen(false); },
    },
    ...MODULES.map((module) => ({
      id: `kill-${module.id}`,
      title: `${killed[module.id] ? "Restore" : "Kill"} ${module.label} Remote`,
      run: () => { toggleKill(module.id); setIsCommandPaletteOpen(false); },
    })),
  ];

  return [...navigationCommands, ...themeCommands, ...demoCommands];
}, [navigate, killed, variant]);

// Filtering — simple substring match against a combined search string
const filteredCommands = useMemo(() => {
  const q = commandQuery.trim().toLowerCase();
  if (!q) return commandActions;
  return commandActions.filter((cmd) =>
    `${cmd.title} ${cmd.subtitle} ${cmd.keywords}`.toLowerCase().includes(q)
  );
}, [commandActions, commandQuery]);
```

### Lab (Federation Lab)

**Purpose:** A live demo control panel for proving micro-frontend resilience — fault isolation, health monitoring, and independent deployment versioning.

Click the **Lab** button (orange border, right side of header) or use the command palette (`Ctrl+K` → "Open Federation Lab") to open a full-height slide-over panel. It contains four sections:

**1. Remote Health Monitor**
- Polls each remote's `remoteEntry.js` endpoint every 5 seconds (only while the panel is open).
- Shows a color-coded status dot (green = online, red = offline/killed, gray = checking) with per-remote latency in milliseconds.
- Lists each remote by name, port, and current status.

**2. Fault Isolation — Kill Switches**
- One toggle per remote module. Clicking a toggle "kills" that remote — the shell immediately renders a `ModuleFallback` component for that module while all other modules continue working.
- **Kill All** / **Restore All** bulk actions for dramatic demo moments.
- The kill is client-side only (the dev server keeps running). It simulates what happens when a remote's CDN is down or a deploy is broken.
- The status strip in the header shows a red "N KILLED" counter when any remotes are down.

**3. A/B Deployment Ring**
- Toggles between **Stable** and **Canary** deployment variants.
- Shows per-module version info (version number + build hash) that changes based on the active ring.
- The status strip shows a "CANARY" badge when the canary ring is active.
- Demonstrates how each remote can be deployed at a different version independently — one team ships canary while others stay on stable.

**4. Hot Reload Guide**
- Step-by-step instructions for demonstrating independent deployment live: stop a remote's dev server, show the ErrorBoundary fallback, edit source code, restart the server, click Retry — the module reloads with changes while others never went down.

**Why it matters for the demo:** This is the centerpiece of the live talk. It lets the speaker prove fault isolation in real time (kill a remote → others keep running), show independent versioning (canary ring), and demonstrate that the architecture handles failure gracefully. It answers the skeptic's question: "What happens when one team's deploy breaks?"

**Implementation (`lib/health.ts` + `lib/demo.ts` + `DemoPanel.tsx`):**

The Federation Lab is composed from three custom hooks in `lib/` and one presentation component:

**1. `useRemoteHealth(remotes, enabled)` — `lib/health.ts`**

Polls each remote's `remoteEntry.js` via `fetch()` with `method: "HEAD"` and `mode: "no-cors"` every 5 seconds. Returns a readonly array of `RemoteHealth` objects with `status` (`"online" | "offline" | "checking"`), `latencyMs`, and `lastChecked`. Polling only runs when `enabled` is `true` (tied to the panel being open) to avoid unnecessary network traffic. Uses `useRef` for the enabled flag to avoid stale closures in the interval callback.

```typescript
// lib/health.ts — core polling logic
async function checkRemote(port: string): Promise<{ ok: boolean; latencyMs: number }> {
  const start = performance.now();
  try {
    const response = await fetch(`http://localhost:${port}/remoteEntry.js`, {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-store",
    });
    const latencyMs = Math.round(performance.now() - start);
    return { ok: response.ok || response.type === "opaque", latencyMs };
  } catch {
    return { ok: false, latencyMs: Math.round(performance.now() - start) };
  }
}
```

**2. `useKillSwitch(moduleIds)` — `lib/demo.ts`**

Manages a `Record<string, boolean>` of killed states. Returns `{ killed, toggle, killAll, restoreAll }`. The `toggle` function flips one module's killed state; `killAll`/`restoreAll` set all modules at once. State is entirely client-side — no server interaction. The shell's `ModuleView` component checks `isKilled` before rendering: if true, it renders `<ModuleFallback>` immediately instead of attempting the lazy import.

```typescript
// lib/demo.ts — kill switch hook
export function useKillSwitch(moduleIds: readonly string[]) {
  const [killed, setKilled] = useState<KilledRemotes>(() =>
    Object.fromEntries(moduleIds.map((id) => [id, false]))
  );

  const toggle = useCallback((id: string) => {
    setKilled((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const killAll = useCallback(() => {
    setKilled((prev) =>
      Object.fromEntries(Object.keys(prev).map((id) => [id, true]))
    );
  }, []);

  const restoreAll = useCallback(() => {
    setKilled((prev) =>
      Object.fromEntries(Object.keys(prev).map((id) => [id, false]))
    );
  }, []);

  return { killed, toggle, killAll, restoreAll } as const;
}

// App.tsx — how the kill switch integrates with rendering
function ModuleView({ module, isKilled }: { module: ModuleConfig; isKilled: boolean }) {
  if (isKilled) {
    return <ModuleFallback title={`${module.label} Module Killed`} message="..." />;
  }
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}
```

**3. `useVersionRegistry(moduleIds)` — `lib/demo.ts`**

Manages a `"stable" | "canary"` variant toggle with two static version maps (`MOCK_VERSIONS` and `CANARY_VERSIONS`). Returns `{ variant, versions, toggleVariant }`. The `versions` array is a `useMemo` that selects from the active registry. In a real production system, these version maps would come from a remote manifest or deployment API.

```typescript
// lib/demo.ts — version registry hook
export function useVersionRegistry(moduleIds: readonly string[]) {
  const [variant, setVariant] = useState<DeploymentVariant>("stable");

  const versions = useMemo<readonly RemoteVersionInfo[]>(() => {
    const registry = variant === "stable" ? MOCK_VERSIONS : CANARY_VERSIONS;
    return moduleIds.map((id) => registry[id]!);
  }, [moduleIds, variant]);

  const toggleVariant = useCallback(() => {
    setVariant((prev) => (prev === "stable" ? "canary" : "stable"));
  }, []);

  return { variant, versions, toggleVariant } as const;
}
```

**4. `DemoPanel.tsx` — presentation component**

A `memo`-wrapped component that receives all three hooks' outputs as props. It renders four sections (Health Monitor, Kill Switches, A/B Deployment, Hot Reload Guide) as pure presentation with zero business logic. Status colors are driven by a `STATUS_CONFIG` lookup table. The component is entirely controlled — all state mutations happen through callback props (`onToggleKill`, `onKillAll`, `onRestoreAll`, `onToggleVariant`).

### Individual kill scripts

```bash
npm run kill:records    # Stop records on :3001
npm run kill:prescriptions         # Stop prescriptions on :3002
npm run kill:analytics    # Stop analytics on :3003
npm run kill:home         # Stop home on :3004
npm run kill:ports        # Stop all demo ports (3000–3004)
```

## Testing

The project uses **Vitest** + **React Testing Library** with `jsdom` for component testing. Tests live alongside source files.

```bash
npm test              # Run all tests once
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report (v8)
npm run lint          # Lint all packages with ESLint
npm run typecheck     # TypeScript validation across all packages
```

Remote module imports are aliased in `vitest.config.ts` so federated components can be tested in isolation without running dev servers. Each package has its own test file:

- `packages/shell/src/App.test.tsx` — navigation, tab switching, notification system, skeleton fallbacks
- `packages/records/src/MedicalRecords.test.tsx` — filtering, add-to-cart events, records grid
- `packages/prescriptions/src/PrescriptionOrders.test.tsx` — quantity controls, remove items, order summary, event listeners
- `packages/analytics/src/ClinicalAnalytics.test.tsx` — stats display, activity stream, welcome banner

The shell test suite also covers theme restoration from `localStorage`, theme persistence, and `themeChange` event broadcasting.

## GitHub Pages Deployment

This repo includes [.github/workflows/deploy.yml](.github/workflows/deploy.yml), which builds all remotes, assembles a single static site, and deploys it with the GitHub Pages artifact workflow.

The workflow now checks whether a Pages site already exists before building. If the repository has never had Pages enabled, there are two supported bootstrap paths:

- Enable Pages once in the repository settings and set **Source** to **GitHub Actions**.
- Or add a `PAGES_ADMIN_TOKEN` repository secret with **Pages: write** and **Administration: write** permissions so the workflow can create the Pages site automatically.

After that first bootstrap, normal deploys can continue with the default workflow token.

## React Suspense Streaming Pattern

Each remote uses a Resource-based Suspense pattern to simulate network streaming:

```typescript
function createResource<T>(asyncFn: () => Promise<T>): Resource<T> {
  let status = "pending";
  let result: T;
  let suspender = asyncFn().then(
    (data) => { status = "success"; result = data; },
    (error) => { status = "error"; result = error; }
  );
  return {
    read() {
      if (status === "pending") throw suspender;     // Suspense catches this
      if (status === "error") throw result;           // ErrorBoundary catches this
      return result;
    },
  };
}
```

The shell wraps each lazy-loaded remote in `<Suspense fallback={<Skeleton />}>` and `<ErrorBoundary>`, giving each module independent loading and error states. The shell uses three distinct loading strategies:

- **Instant** (Home) — imports the standalone component via `home/Home`, no streaming delay
- **Eager** (Records) — imports the streaming wrapper but preloads it on shell mount
- **Streamed** (Prescriptions, Analytics) — loaded on demand with skeleton fallbacks

## Why React 19 (Not 18) for Module Federation + Suspense

React 19 introduced a behavioral change in Suspense: sibling components inside the **same** `<Suspense>` boundary now render sequentially instead of in parallel. If the first sibling suspends, subsequent siblings wait — creating a potential waterfall. This raised concerns in the community about whether React 19 is safe for streaming micro-frontends.

**This architecture is unaffected.** Here's why:

| Concern | This demo's architecture | Impact |
|---------|--------------------------|--------|
| Sibling waterfall | Route-based rendering — only **one** module renders at a time | Not affected |
| Same-boundary siblings | Each module has its own `<Suspense>` + `<ErrorBoundary>` | Parallel preserved |
| throw-promise pattern | `createResource` still works in React 19 (legacy, not broken) | No breakage |
| Pre-fetching | Eager preload + hover prefetch = chunks cached before render | Waterfall impossible |

**React 19 actively benefits this architecture:**

1. **Suspense batching (19.2+)** — Instead of showing fallbacks one boundary at a time, React 19 groups multiple boundary transitions in a single render pass. This means skeleton → content transitions are smoother — no "popping in" effect when navigating between modules.

2. **Render-as-you-fetch** — React 19 encourages hoisting data calls outside components. The `createResource` pattern already does this — the resource is created at module evaluation time, not inside the component. The component just calls `resource.read()`.

3. **Deterministic concurrent rendering** — The shell re-renders frequently (theme changes, command palette filtering, kill switch toggles). React 19's compiler optimizations skip entire update paths that haven't changed, making these interactions snappier.

4. **Streaming SSR readiness** — React 19's improved batching in streaming SSR reduces "UI churn" (flickering). If this demo ever adds SSR, the skeleton → content transitions would look even better server-side.

```tsx
// This architecture avoids the waterfall by design:

// 1. Route-based: only one module renders at a time
<Routes>
  <Route path="/records" element={<ModuleView module={records} />} />
  <Route path="/prescriptions" element={<ModuleView module={prescriptions} />} />
</Routes>

// 2. Each module has its own Suspense boundary (never siblings)
function ModuleView({ module }) {
  return (
    <ErrorBoundary>           {/* ← own error boundary */}
      <Suspense fallback={..}> {/* ← own suspense boundary */}
        <module.component />
      </Suspense>
    </ErrorBoundary>
  );
}

// 3. Pre-fetching eliminates any remaining concern
const EAGER_MODULES = MODULES.filter((m) => m.loadStrategy === "eager");
for (const m of EAGER_MODULES) { PREFETCHERS[m.id](); }  // cached before render
```

> **Bottom line:** React 19 is the right choice. The waterfall concern applies to sibling components in the same boundary — a pattern this architecture intentionally avoids. The batching and compiler improvements directly benefit the shell's UX.

## Conference Demo Value

This project demonstrates these micro-frontend concepts during a live talk:

1. **Independent deployment** — each remote starts on its own port with its own build
2. **Fault isolation** — kill a remote server and only that module shows a fallback (or use the Federation Lab kill switch)
3. **Shared dependencies** — React is loaded once via singleton sharing
4. **Suspense streaming** — skeleton screens appear during module load, then content streams in (for streamed and eager modules)
5. **Loading strategy taxonomy** — instant (Home), eager (Records), streamed (Prescriptions/Analytics) — not every module should load the same way
5. **Loose coupling** — modules communicate through events, not imports
6. **Host-owned routing** — remotes can request navigation through `navigateToModule` without importing `react-router-dom`
7. **Independent tech choices** — each package has its own `rspack.config.js`, `postcss.config.js`, and `tsconfig.json`
8. **Design system consistency** — shared `@theme` tokens across all packages keep the UI cohesive without a shared CSS build step
9. **Live demo controls** — the Federation Lab panel lets you kill/restore remotes, monitor health, and toggle A/B deployment during a presentation

### What to show in a talk

- Start `npm run dev`, open `:3000` — Home loads **instantly** (no skeleton delay, status strip shows INSTANT)
- Click Records — loads fast because it was **eagerly preloaded** on shell mount (status strip shows EAGER)
- Click Prescriptions — observe skeleton **streaming** in (status strip shows STREAMING)
- Navigate to `/records`, add a prescription, then use the prescriptions empty-state CTA to show remote-requested host navigation
- Open the Federation Lab (click **Lab** in the header) and kill the records remote — records shows `ModuleFallback`, prescriptions and analytics continue working
- Restore the remote from the Lab panel — records comes back
- Toggle the A/B deployment ring from stable to canary — version info updates per module
- Kill a real remote server (`Ctrl+C` on `:3001`) — the health monitor detects it offline
- Restart it — records comes back without refreshing the shell
- Inspect the network tab — each module loads its own `remoteEntry.js` chunk

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all five dev servers concurrently |
| `npm run build` | Build all five packages for production |
| `npm run dev:shell` | Start only the shell (`:3000`) |
| `npm run dev:home` | Start only home (`:3004`) |
| `npm run dev:records` | Start only records (`:3001`) |
| `npm run dev:prescriptions` | Start only prescriptions (`:3002`) |
| `npm run dev:analytics` | Start only analytics (`:3003`) |
| `npm run kill:ports` | Kill all demo ports (`3000`–`3004`) |
| `npm run kill:records` | Kill only the records port (`:3001`) |
| `npm run kill:prescriptions` | Kill only the prescriptions port (`:3002`) |
| `npm run kill:analytics` | Kill only the analytics port (`:3003`) |
| `npm run kill:home` | Kill only the home port (`:3004`) |

## Prerequisites

- Node.js 20+ (required for Tailwind CSS v4)
- npm 9+
- Modern browser (Chrome 111+, Firefox 128+, Safari 16.4+)

## License

MIT
