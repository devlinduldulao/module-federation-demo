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

## Federation Lab (Demo Controls)

The shell includes a **Federation Lab** panel for live demonstrations. Click the **Lab** button in the header (or use the command palette: `Ctrl+K` → "Open Federation Lab") to access:

- **Remote Health Monitor** — polls each remote's `remoteEntry.js` every 5 seconds with live status indicators and latency
- **Fault Isolation Kill Switches** — toggle any module to simulate a remote going down. The shell renders a `ModuleFallback` while other modules keep running independently
- **A/B Deployment Ring** — switch between stable and canary deployment variants with per-module version info
- **Hot Reload Guide** — step-by-step instructions for demonstrating independent deployment during a live talk

The status bar shows a live count of killed remotes and the active deployment ring.

### Individual kill scripts

```bash
npm run kill:records    # Stop products on :3001
npm run kill:prescriptions         # Stop cart on :3002
npm run kill:analytics    # Stop dashboard on :3003
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
- **Eager** (Products) — imports the streaming wrapper but preloads it on shell mount
- **Streamed** (Prescriptions, Analytics) — loaded on demand with skeleton fallbacks

## Conference Demo Value

This project demonstrates these micro-frontend concepts during a live talk:

1. **Independent deployment** — each remote starts on its own port with its own build
2. **Fault isolation** — kill a remote server and only that module shows a fallback (or use the Federation Lab kill switch)
3. **Shared dependencies** — React is loaded once via singleton sharing
4. **Suspense streaming** — skeleton screens appear during module load, then content streams in (for streamed and eager modules)
5. **Loading strategy taxonomy** — instant (Home), eager (Products), streamed (Cart/Dashboard) — not every module should load the same way
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
| `npm run dev:records` | Start only products (`:3001`) |
| `npm run dev:prescriptions` | Start only cart (`:3002`) |
| `npm run dev:analytics` | Start only dashboard (`:3003`) |
| `npm run kill:ports` | Kill all demo ports (`3000`–`3004`) |
| `npm run kill:records` | Kill only the products port (`:3001`) |
| `npm run kill:prescriptions` | Kill only the cart port (`:3002`) |
| `npm run kill:analytics` | Kill only the dashboard port (`:3003`) |
| `npm run kill:home` | Kill only the home port (`:3004`) |

## Prerequisites

- Node.js 20+ (required for Tailwind CSS v4)
- npm 9+
- Modern browser (Chrome 111+, Firefox 128+, Safari 16.4+)

## License

MIT
