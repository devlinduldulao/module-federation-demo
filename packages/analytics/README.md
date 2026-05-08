# Analytics — Remote Module

The analytics micro-frontend provides a clinical analytics overview with performance metrics and an activity stream. It exposes `ClinicalAnalytics` (instant render) and `StreamingClinicalAnalytics` (Suspense-wrapped with simulated delay).

Runs on **localhost:3003**.

## Exposed Modules

```js
exposes: {
  "./ClinicalAnalytics":          "./src/ClinicalAnalytics.tsx",
  "./StreamingClinicalAnalytics": "./src/StreamingClinicalAnalytics.tsx",
}
```

`ClinicalAnalytics.tsx` imports the module stylesheet directly because the shell loads the exposed component from `remoteEntry.js`. `bootstrap.tsx` is only the standalone mount path.

This package now runs on **Rspack 2**, so its `rspack.config.ts` uses `defineConfig`, the explicit `@module-federation/runtime-tools` and `@rspack/dev-server` dependencies, and Rspack's built-in CSS handling for the module stylesheet.

## File Structure

```
analytics/
├── rspack.config.ts           # MF remote — name: "analytics", port: 3003
├── postcss.config.cjs         # @tailwindcss/postcss
├── tsconfig.json
├── public/index.html          # Standalone dev page
└── src/
    ├── index.tsx              # Standalone bootstrap
    ├── ClinicalAnalytics.tsx      # Full analytics with stats + activity, imports index.css
    ├── ClinicalAnalytics.test.tsx # Analytics rendering tests
    ├── StreamingClinicalAnalytics.tsx # Resource + Suspense wrapper
    ├── index.css              # @theme tokens, count-up animation, activity timeline
    ├── types.ts               # AnalyticsStat, ActivityItem
    └── lib/
        └── utils.ts           # cn() utility
```

## Key Types

```typescript
interface AnalyticsStat {
  readonly label: string;
  readonly value: string | number;
  readonly trend: "up" | "down" | "stable";
  readonly trendValue: string;
}

interface ActivityItem {
  readonly id: string;
  readonly message: string;
  readonly timestamp: string;
  readonly type: "success" | "info" | "warning" | "error";
  readonly icon?: string;
}
```

## Features

- **Welcome banner** — gradient accent line (ice → citrine → mint) at top, serif italic greeting, status badge
- **Stats grid** — 4-column layout with 1px editorial grid gaps. Large serif italic numbers in accent colors (ice, mint, citrine, burnt). Mono labels and trend percentages. Staggered `countUp` animation.
- **Activity stream** — bordered card with divider rows. Colored status dots (mint/ice/burnt/rose). Message text promotes to cream on hover. Citrine left-accent bar appears on hover via CSS `::before`.
- **Architecture footer** — centered description of micro-frontend capabilities with mono labels

## Layout

```
┌──────────────────────────────────┐
│ Analytics Overview (mono label)  │
│ Analytics (serif italic, 6xl)    │
├──────────────────────────────────┤
│ Welcome banner with gradient top │
│ Welcome back, Developer          │
│ Status: Active                   │
├────────┬────────┬────────┬───────┤
│ Orders │ Spent  │ Saved  │ Wish  │
│ 156    │$12,847 │$2,156  │ 24    │
│ +23%   │ +18%   │ +45%   │ +12%  │
├────────┴────────┴────────┴───────┤
│ Activity Stream                  │
│ ● Sarah Chen prescription delivered       │
│ ● Added Lisa Nguyen prescription to watchlist  │
│ ● Lab results review pending    │
├──────────────────────────────────┤
│ Micro-Frontend Architecture      │
│ footer with port + timestamp     │
└──────────────────────────────────┘
```

## Custom CSS

The analytics `index.css` includes module-specific additions:

- `@keyframes countUp` — `translateY(20px)` to `0` for stat card entry
- `.animate-count-up` class
- `.activity-item::before` — 2px citrine left bar that fades in on hover

## Streaming Pattern

Same Resource pattern as other remotes:

```typescript
const StreamingClinicalAnalytics = () => {
  const resource = getResource("analytics-initial", 5000);
  resource.read();
  return <ClinicalAnalytics />;
};
```

## Development

```bash
pnpm run dev    # Starts on :3003
pnpm run build  # Production build
pnpm run lint   # Lint analytics source through the workspace ESLint config
pnpm run typecheck
pnpm run test
```

## Testing

`ClinicalAnalytics.test.tsx` covers stats display, trend percentages, activity stream rendering, welcome banner, Platinum badge, and accessibility roles. The package also exposes `lint`, `typecheck`, and `test` scripts for isolated quality checks. Run from the repo root:

```bash
pnpm test
```
