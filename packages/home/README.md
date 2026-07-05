# Home — Remote Module

The home micro-frontend provides the **landing page** for the Module Federation demo. It renders an architecture overview, key technology stats, and navigation cards for each module. It exposes `Home` (instant render) and `StreamingHome` (Suspense-wrapped with simulated delay).

Runs on **localhost:3004**. Mounted at the root route `/` in the shell.

## Exposed Modules

```js
exposes: {
  "./Home":          "./src/Home.tsx",
  "./StreamingHome": "./src/StreamingHome.tsx",
}
```

The shell imports `Home` directly (the instant loading strategy) — no streaming delay, the landing page renders the moment the chunk arrives.

This package runs on **Rspack 2.1**, so its `rspack.config.ts` uses `defineConfig`, the explicit `@module-federation/runtime-tools` and `@rspack/dev-server` dependencies, Rspack's built-in CSS handling for the module stylesheet, the Rust React Compiler (`reactCompiler: true` in `builtin:swc-loader`), and persistent caching with automatic cleanup.

Because `Home.tsx` is an exposed runtime entrypoint, it imports the module stylesheet directly. `bootstrap.tsx` is only for standalone mounting and should not be the only place that loads `index.css`.

## File Structure

```
home/
├── rspack.config.ts           # MF remote — name: "home", port: 3004
├── postcss.config.cjs         # @tailwindcss/postcss
├── tsconfig.json
├── public/index.html          # Standalone dev page
└── src/
    ├── index.tsx              # Standalone bootstrap (renders Home)
    ├── Home.tsx               # Landing page with architecture overview + nav cards, imports index.css
    ├── StreamingHome.tsx      # Resource + Suspense wrapper
    ├── index.css              # @theme tokens, animations
    ├── types.ts               # ModuleDestination, events
    └── lib/
        ├── utils.ts           # cn() utility
        └── theme.ts           # useActiveTheme hook
```

## Features

- **Hero section** — serif italic heading with "MF" badge, architecture subtitle
- **Architecture stats grid** — 4-column layout showing Pattern (Module Federation), Runtime (React 19), Bundler (Rspack), Modules (4 Remotes)
- **Destination cards** — 3 navigation cards (Records, Prescriptions, Analytics) with port info, icon badges, descriptions, and hover effects
- **Cross-module navigation** — cards dispatch `navigateToModule` CustomEvents so the shell handles routing
- **Theme awareness** — uses `useActiveTheme()` hook to react to shell theme changes

## Inter-Module Communication

When a user clicks a destination card, the component dispatches:

```typescript
window.dispatchEvent(
  new CustomEvent("navigateToModule", {
    detail: { module: destination.id },
  })
);
```

The shell listens for `navigateToModule` and handles the route change. The home module never imports `react-router-dom`.

## Streaming Pattern

Same Resource pattern as other remotes:

```typescript
const StreamingHome = () => {
  const resource = getResource("home-initial", 1500);
  resource.read();
  return <Home />;
};
```

## Development

```bash
pnpm run dev    # Starts on :3004
pnpm run build  # Production build
pnpm run lint   # Lint home source through the workspace ESLint config
pnpm run typecheck
pnpm run test
```

## Testing

`Home.test.tsx` and `StreamingHome.test.tsx` cover the landing page content, navigation request events, and streaming behavior. Run from the repo root:

```bash
pnpm test
```

Visit `http://localhost:3004` to see the landing page standalone. The shell at `:3000` loads this module's `remoteEntry.js` automatically at the root route `/`.
