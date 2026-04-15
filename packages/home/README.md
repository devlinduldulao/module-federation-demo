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

## File Structure

```
home/
├── rspack.config.js           # MF remote — name: "home", port: 3004
├── postcss.config.js          # @tailwindcss/postcss
├── tsconfig.json
├── public/index.html          # Standalone dev page
└── src/
    ├── index.tsx              # Standalone bootstrap (renders Home)
    ├── Home.tsx               # Landing page with architecture overview + nav cards
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
- **Destination cards** — 3 navigation cards (Products, Cart, Dashboard) with port info, icon badges, descriptions, and hover effects
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
npm run dev    # Starts on :3004
npm run build  # Production build
npm run typecheck
```

Visit `http://localhost:3004` to see the landing page standalone. The shell at `:3000` loads this module's `remoteEntry.js` automatically at the root route `/`.
