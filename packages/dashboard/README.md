# Dashboard — Remote Module

The dashboard micro-frontend provides an analytics overview with performance metrics and an activity stream. It exposes `UserDashboard` (instant render) and `StreamingUserDashboard` (Suspense-wrapped with simulated delay).

Runs on **localhost:3003**.

## Exposed Modules

```js
exposes: {
  "./UserDashboard":          "./src/UserDashboard.tsx",
  "./StreamingUserDashboard": "./src/StreamingUserDashboard.tsx",
}
```

## File Structure

```
dashboard/
├── rspack.config.js           # MF remote — name: "dashboard", port: 3003
├── postcss.config.js          # @tailwindcss/postcss
├── tsconfig.json
├── public/index.html           # Standalone dev page
└── src/
    ├── index.tsx               # Standalone bootstrap
    ├── UserDashboard.tsx      # Full dashboard with stats + activity
  ├── UserDashboard.test.tsx # Dashboard rendering tests
    ├── StreamingUserDashboard.tsx # Resource + Suspense wrapper
    ├── index.css               # @theme tokens, count-up animation, activity timeline
    ├── types.ts                # DashboardStat, ActivityItem
    └── lib/
        └── utils.ts            # cn() utility
```

## Key Types

```typescript
interface DashboardStat {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly emoji?: string;
  readonly color: string;       // Tailwind color class (e.g. "text-ice")
  readonly trend?: {
    direction: "up" | "down" | "neutral";
    percentage: number;
  };
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
│ Dashboard (serif italic, 6xl)    │
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
│ ● MacBook Pro M3 delivered       │
│ ● Added AirPods Pro to wishlist  │
│ ● iPhone 15 Pro order processing │
├──────────────────────────────────┤
│ Micro-Frontend Architecture      │
│ footer with port + timestamp     │
└──────────────────────────────────┘
```

## Custom CSS

The dashboard `index.css` includes module-specific additions:

- `@keyframes countUp` — `translateY(20px)` to `0` for stat card entry
- `.animate-count-up` class
- `.activity-item::before` — 2px citrine left bar that fades in on hover

## Streaming Pattern

Same Resource pattern as other remotes:

```typescript
const StreamingUserDashboard = () => {
  const resource = getResource("dashboard-initial", 5000);
  resource.read();
  return <UserDashboard />;
};
```

## Development

```bash
npm run dev    # Starts on :3003
npm run build  # Production build
npm run lint   # Lint dashboard source through the workspace ESLint config
npm run typecheck
npm run test
```

## Testing

`UserDashboard.test.tsx` covers stats display, trend percentages, activity stream rendering, welcome banner, Platinum badge, and accessibility roles. The package also exposes `lint`, `typecheck`, and `test` scripts for isolated quality checks. Run from the repo root:

```bash
npm test
```
