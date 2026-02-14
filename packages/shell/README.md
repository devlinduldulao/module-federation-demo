# Shell — Host Application

The shell is the **host** in the Module Federation topology. It defines three remotes (`products`, `cart`, `dashboard`), renders a tab-based navigation, and wraps each lazily-loaded remote module in `<Suspense>` + `<ErrorBoundary>` for independent loading and fault isolation.

Runs on **localhost:3000**.

## Responsibilities

- Lazy-load remote streaming components via `React.lazy` + dynamic `import()`
- Provide per-module skeleton fallbacks (`ProductsSkeleton`, `CartSkeleton`, `DashboardSkeleton`)
- Catch module-level errors with `ErrorBoundary` — a crashed remote never takes down the shell
- Show `ModuleFallback` when a remote server is offline
- Render the navigation, status strip, notification toasts, and page layout
- Listen for `showNotification` events from any module and display dark toasts

## File Structure

```
shell/
├── rspack.config.js           # MF host — remotes: products, cart, dashboard
├── postcss.config.js          # @tailwindcss/postcss
├── tsconfig.json
├── public/index.html
└── src/
    ├── index.tsx              # Dynamic import('./bootstrap')
    ├── bootstrap.tsx          # createRoot + <App />
    ├── App.tsx                # Navigation, Suspense, ErrorBoundary orchestration
    ├── index.css              # @theme tokens, animations, noise grain, scrollbar
    ├── types.d.ts             # declare module "products/..." etc.
    ├── components/
    │   ├── ErrorBoundary.tsx      # Class component, catches JS errors per module
    │   ├── ModuleFallback.tsx     # Module unavailable card with retry
    │   ├── LoadingSpinner.tsx     # Three citrine dots with staggered pulse
    │   ├── ProductsSkeleton.tsx   # Products grid skeleton with shimmer
    │   ├── CartSkeleton.tsx       # Cart table skeleton
    │   └── DashboardSkeleton.tsx  # Dashboard stats + activity skeleton
    └── lib/
        └── utils.ts               # cn() — clsx + tailwind-merge
```

## Module Federation Config

```js
new rspack.container.ModuleFederationPlugin({
  name: "shell",
  remotes: {
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

Tab-based navigation using a `ModuleConfig[]` array:

```ts
type ModuleType = "products" | "cart" | "dashboard";

interface ModuleConfig {
  readonly id: ModuleType;
  readonly label: string;
  readonly port: string;
  readonly component: React.LazyExoticComponent<React.ComponentType>;
}
```

Active tab gets a citrine underline (`h-[2px] bg-citrine`). The status strip below the nav shows the current module name, port, and streaming status in monospace.

## Notification System

The shell listens for `showNotification` events globally:

```ts
window.addEventListener("showNotification", (event) => {
  const { type, message } = event.detail;
  // Adds a dark toast with auto-dismiss after 3s
});
```

Any remote can trigger notifications by dispatching this event.

## Design Tokens

Defined in `index.css` under `@theme { ... }` — see the root README for the full token table. The shell also defines all shared animations: `fadeInUp`, `slideInRight`, `shimmer`, `subtlePulse`, etc.

## Development

```bash
npm run dev    # Starts rspack-dev-server on :3000
npm run build  # Production build to dist/
```

Requires all three remotes to be running for full functionality, but the shell starts fine on its own — offline remotes show `ModuleFallback`.\n