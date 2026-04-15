# Shell — Host Application

The shell is the **host** in the Module Federation topology. It defines four remotes (`home`, `products`, `cart`, `dashboard`), renders navigation and shell chrome, owns the shared theme state, and wraps each lazily-loaded remote module in `<Suspense>` + `<ErrorBoundary>` for independent loading and fault isolation.

Runs on **localhost:3000**.

The root route `/` renders the **Home** landing page. Unknown routes redirect to `/`.

## Responsibilities

- Lazy-load remote streaming components via `React.lazy` + dynamic `import()`
- Provide per-module skeleton fallbacks (`HomeSkeleton`, `ProductsSkeleton`, `CartSkeleton`, `DashboardSkeleton`)
- Catch module-level errors with `ErrorBoundary` — a crashed remote never takes down the shell
- Show `ModuleFallback` when a remote server is offline or killed via the demo panel
- Render the route-driven navigation, status strip, notification toasts, and page layout
- Listen for `showNotification` events from any module and display dark toasts
- Dispatch `moduleChange` events when switching tabs so other modules can react
- Listen for `navigateToModule` events so remotes can request host-owned navigation without importing the shell router
- Prefetch remote entry points on tab hover via a `PREFETCH_MAP`
- Persist the selected theme in `localStorage`
- Broadcast `themeChange` events and expose `window.__MF_THEME__` to remotes
- Provide the **Federation Lab** demo panel with remote health monitoring, kill switches, and A/B deployment controls

## File Structure

```
shell/
├── rspack.config.js           # MF host — remotes: home, products, cart, dashboard
├── postcss.config.js          # @tailwindcss/postcss
├── tsconfig.json
├── public/index.html
└── src/
    ├── index.tsx              # Dynamic import('./bootstrap')
    ├── bootstrap.tsx          # Theme init + createRoot + <App />
    ├── App.tsx                # Navigation, Suspense, ErrorBoundary orchestration
    ├── App.test.tsx           # Shell behavior, events, theme persistence
    ├── index.css              # @theme tokens, animations, noise grain, scrollbar
    ├── types.d.ts             # declare module "home/...", "products/..." etc.
    ├── components/
    │   ├── ErrorBoundary.tsx      # Class component, catches JS errors per module
    │   ├── ModuleFallback.tsx     # Module unavailable card with retry
    │   ├── DemoPanel.tsx          # Federation Lab — health, kill switches, A/B deployment
    │   ├── LoadingSpinner.tsx     # Three citrine dots with staggered pulse
    │   ├── HomeSkeleton.tsx       # Home landing page skeleton
    │   ├── ProductsSkeleton.tsx   # Products grid skeleton with shimmer
    │   ├── CartSkeleton.tsx       # Cart table skeleton
    │   └── DashboardSkeleton.tsx  # Dashboard stats + activity skeleton
    └── lib/
        ├── theme.ts               # Theme definitions, persistence, event bridge
        ├── health.ts              # useRemoteHealth — polls remoteEntry.js endpoints
        ├── demo.ts                # useKillSwitch + useVersionRegistry hooks
        └── utils.ts               # cn() — clsx + tailwind-merge
```

## Module Federation Config

```js
new rspack.container.ModuleFederationPlugin({
  name: "shell",
  remotes: {
    home:      "home@http://localhost:3004/remoteEntry.js",
    products:  "products@http://localhost:3001/remoteEntry.js",
    cart:      "cart@http://localhost:3002/remoteEntry.js",
    dashboard: "dashboard@http://localhost:3003/remoteEntry.js",
  },
  shared: {
    react:            { singleton: true, strictVersion: false },
    "react-dom":      { singleton: true, strictVersion: false },
    "react-dom/client":{ singleton: true, strictVersion: false },
  },
});
```

## How Lazy Loading Works

```tsx
const StreamingProductsCatalog = lazy(() =>
  import("products/StreamingProductsCatalog").catch((error) => {
    console.error("Failed to load StreamingProductsCatalog:", error);
    return {
      default: () => <ModuleFallback title="Products Module Unavailable" />,
    };
  })
);
```

Each `lazy()` call has a `.catch()` that returns a fallback component — if the remote server is unreachable, the user sees a clean fallback instead of a blank screen.

In `App.tsx`, the active module is rendered inside:

```tsx
<ErrorBoundary>
  <Suspense fallback={<ProductsSkeleton />} key={activeModule}>
    <Component />
  </Suspense>
</ErrorBoundary>
```

The `key={activeModule}` prop forces React to unmount/remount when switching tabs, which re-triggers Suspense for the streaming delay.

## Navigation

The shell now uses `react-router-dom` for client-side routing. Each remote is mounted behind a shareable URL:

- `/` (Home)
- `/products`
- `/cart`
- `/dashboard`

Routing is still driven from the shell-level `ModuleConfig[]` array:

```ts
type ModuleType = "home" | "products" | "cart" | "dashboard";

interface ModuleConfig {
  readonly id: ModuleType;
  readonly label: string;
  readonly path: string;
  readonly port: string;
  readonly component: React.LazyExoticComponent<React.ComponentType>;
}
```

Each nav item is a real link, so the browser URL updates and users can bookmark or share any module directly. Active routes still get the citrine underline, and the status strip below the nav shows the current module name, port, and streaming status in monospace.

When a tab is switched, the shell dispatches a `moduleChange` event:

```ts
window.dispatchEvent(
  new CustomEvent("moduleChange", { detail: { newModule: moduleId } })
);
```

Remotes can request navigation by dispatching:

```ts
window.dispatchEvent(
  new CustomEvent("navigateToModule", {
    detail: { module: "products" },
  })
);
```

The shell remains the only owner of router state, but remotes can still trigger intentional flows such as “Browse Products” from the cart empty state.

## Prefetching

The shell defines a `PREFETCH_MAP` that maps each module to a bare `import()` call. On hover, the corresponding remote entry point is fetched in the background so the module loads instantly when clicked.

## Theme System

The shell owns two themes:

- `dark` — the default noir palette
- `light` — a clean white theme with crisp high-contrast text

`bootstrap.tsx` calls `initializeTheme()` before mounting React, so the correct CSS variables are present on first paint. Theme changes are stored under `mf-demo-theme`, applied to `document.documentElement.dataset.theme`, and broadcast globally:

```ts
window.dispatchEvent(
  new CustomEvent("themeChange", {
    detail: { theme: "light", colorScheme: "light" },
  })
);
```

For remote modules that need shell-owned theming, the host also exposes:

```ts
window.__MF_THEME__?.getTheme();
window.__MF_THEME__?.setTheme("light");
```

## Notification System

The shell listens for `showNotification` events globally:

```ts
window.addEventListener("showNotification", (event) => {
  const { type, message } = event.detail;
  // Adds a dark toast with auto-dismiss after 3s.
  // Supports success, error, info, and warning.
});
```

Any remote can trigger notifications by dispatching this event.

## Design Tokens

Defined in `index.css` under `@theme { ... }` — see the root README for the full token table. The shell also defines all shared animations: `fadeInUp`, `slideInRight`, `shimmer`, `subtlePulse`, etc.

## Federation Lab (Demo Panel)

The shell includes a slide-out **Federation Lab** panel (`DemoPanel.tsx`) for live conference demos:

- **Remote Health Monitor** (`lib/health.ts`) — `useRemoteHealth` polls each remote's `remoteEntry.js` via HEAD requests every 5 seconds. Shows status dots (online/offline/checking) and latency per module.
- **Fault Isolation Kill Switches** (`lib/demo.ts`) — `useKillSwitch` toggles modules as "killed". When a module is killed, `ModuleView` renders `ModuleFallback` instead of loading the remote. Other modules keep running independently.
- **A/B Deployment Ring** (`lib/demo.ts`) — `useVersionRegistry` provides mock stable/canary version info per module. Toggle between rings to simulate independent version deployment.
- **Hot Reload Guide** — Step-by-step instructions embedded in the panel.

Open with the **Lab** button in the header or via the command palette (`Ctrl+K` → "Open Federation Lab"). Kill/restore commands and variant toggles are also available as command palette actions.

## Development

```bash
npm run dev    # Starts rspack-dev-server on :3000
npm run build  # Production build to dist/
npm run lint   # Lint shell source through the workspace ESLint config
npm run typecheck
npm run test
```

Requires all four remotes to be running for full functionality, but the shell starts fine on its own — offline remotes show `ModuleFallback`.

From the repo root, `npm run ports:check` verifies that `3000`–`3003` are free before you start the full conference demo.

## Testing

`App.test.tsx` covers route rendering, direct URL entry, redirects, `moduleChange` event dispatch, notification display and auto-dismiss, skeleton fallback rendering, theme restoration, theme persistence, and `themeChange` event broadcasting. Run from the repo root:

```bash
npm test
```