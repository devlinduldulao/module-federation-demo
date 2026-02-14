# Module Federation Demo

A micro-frontend architecture demo built with **Rspack Module Federation**, **React 19**, **TypeScript**, and **Tailwind CSS v4**. Four independent applications compose into a single shell — each deployable, scalable, and maintainable on its own.

Built for conference talks and technical demonstrations.

## Architecture

```
Shell (host)           localhost:3000
├── Products (remote)  localhost:3001   → StreamingProductsCatalog
├── Cart (remote)      localhost:3002   → StreamingShoppingCart
└── Dashboard (remote) localhost:3003   → StreamingUserDashboard
```

Each remote exposes a **Streaming** component (wraps a Resource-based Suspense pattern to simulate network delay) and a **Standalone** component (renders immediately). The shell lazy-loads the streaming variants and wraps them in `<Suspense>` with per-module skeleton fallbacks and `<ErrorBoundary>` for fault isolation.

## Quick Start

```bash
# Install everything (root + all 4 packages)
npm install

# Start all four dev servers concurrently
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The shell will pull remote entry points from ports 3001–3003.

### Run a single package

```bash
cd packages/products && npm run dev   # :3001
cd packages/cart && npm run dev       # :3002
cd packages/dashboard && npm run dev  # :3003
cd packages/shell && npm run dev      # :3000
```

Each remote runs standalone at its own port with its own `index.html`.

## Project Structure

```
module-federation-demo/
├── package.json                       # Workspace scripts (concurrently)
└── packages/
    ├── shell/                         # Host application
    │   ├── rspack.config.js           # MF remotes config
    │   ├── src/
    │   │   ├── App.tsx                # Navigation, Suspense orchestration
    │   │   ├── bootstrap.tsx          # createRoot entry
    │   │   ├── index.css              # Design system tokens + animations
    │   │   ├── types.d.ts             # Remote module declarations
    │   │   └── components/
    │   │       ├── ErrorBoundary.tsx   # Per-module error isolation
    │   │       ├── ModuleFallback.tsx  # Offline module placeholder
    │   │       ├── LoadingSpinner.tsx  # Generic loading dots
    │   │       ├── ProductsSkeleton.tsx
    │   │       ├── CartSkeleton.tsx
    │   │       └── DashboardSkeleton.tsx
    │   └── lib/utils.ts               # cn() — clsx + tailwind-merge
    ├── products/                      # Remote — product catalog
    │   ├── rspack.config.js           # MF exposes config
    │   └── src/
    │       ├── ProductsCatalog.tsx     # Standalone version
    │       ├── StreamingProductsCatalog.tsx  # Suspense-wrapped
    │       └── types.ts
    ├── cart/                          # Remote — shopping cart
    │   ├── rspack.config.js
    │   └── src/
    │       ├── ShoppingCart.tsx
    │       ├── StreamingShoppingCart.tsx
    │       └── types.ts
    └── dashboard/                     # Remote — analytics dashboard
        ├── rspack.config.js
        └── src/
            ├── UserDashboard.tsx
            ├── StreamingUserDashboard.tsx
            └── types.ts
```

## Tech Stack

| Tool | Version | Role |
|------|---------|------|
| React | ^19.2.4 | UI library |
| TypeScript | ^5.9.3 | Type safety |
| Rspack | ^1.7.6 | Bundler + Module Federation |
| Tailwind CSS | v4 | Utility-first CSS via `@theme` |
| PostCSS | ^8.5.6 | CSS pipeline (`@tailwindcss/postcss`) |
| concurrently | ^9.2.1 | Dev server orchestration |

## Design System — "Noir Editorial"

A dark, typographic design language that avoids generic pastel AI aesthetics. Defined via Tailwind v4 `@theme` tokens in each package's `index.css`.

### Typography

| Role | Font | Usage |
|------|------|-------|
| Display | Instrument Serif | Headlines, large numbers (italic) |
| Body | DM Sans | Paragraphs, UI text |
| Technical | IBM Plex Mono | Labels, prices, metadata, navigation |

### Color Tokens

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
    products: "products@http://localhost:3001/remoteEntry.js",
    cart:     "cart@http://localhost:3002/remoteEntry.js",
    dashboard:"dashboard@http://localhost:3003/remoteEntry.js",
  },
  shared: {
    react:       { singleton: true, strictVersion: false },
    "react-dom": { singleton: true, strictVersion: false },
  },
});
```

### Remote (example: products)

```js
// rspack.config.js — products
new rspack.container.ModuleFederationPlugin({
  name: "products",
  filename: "remoteEntry.js",
  exposes: {
    "./ProductsCatalog":          "./src/ProductsCatalog.tsx",
    "./StreamingProductsCatalog": "./src/StreamingProductsCatalog.tsx",
  },
  shared: { react: { singleton: true }, "react-dom": { singleton: true } },
});
```

## Inter-Module Communication

Modules communicate through typed `CustomEvent` dispatch on `window`:

```typescript
// Products → Cart: add item
window.dispatchEvent(
  new CustomEvent("addToCart", {
    detail: { id: 1, name: "Laptop", price: 999.99, quantity: 1 },
    bubbles: true,
  })
);

// Any module → Shell: trigger notification toast
window.dispatchEvent(
  new CustomEvent("showNotification", {
    detail: { type: "success", message: "Item added to cart" },
  })
);
```

Events are typed in each package's `types.ts` via `WindowEventMap` augmentation:

```typescript
export interface AddToCartEvent extends CustomEvent {
  detail: CartItem;
}

declare global {
  interface WindowEventMap {
    addToCart: AddToCartEvent;
    showNotification: NotificationEvent;
  }
}
```

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

The shell wraps each lazy-loaded remote in `<Suspense fallback={<Skeleton />}>` and `<ErrorBoundary>`, giving each module independent loading and error states.

## Conference Demo Value

This project demonstrates these micro-frontend concepts during a live talk:

1. **Independent deployment** — each remote starts on its own port with its own build
2. **Fault isolation** — kill a remote server and only that module shows a fallback
3. **Shared dependencies** — React is loaded once via singleton sharing
4. **Suspense streaming** — skeleton screens appear during module load, then content streams in
5. **Loose coupling** — modules communicate through events, not imports
6. **Independent tech choices** — each package has its own `rspack.config.js`, `postcss.config.js`, and `tsconfig.json`
7. **Design system consistency** — shared `@theme` tokens across all packages keep the UI cohesive without a shared CSS build step

### What to show in a talk

- Start `npm run dev`, open `:3000` — all three modules load with streaming skeletons
- Kill the products server (`Ctrl+C` on `:3001`) — products module shows `ModuleFallback`, cart and dashboard continue working
- Restart it — products comes back without refreshing the shell
- Add a product to cart — the `addToCart` event crosses module boundaries
- Inspect the network tab — each module loads its own `remoteEntry.js` chunk

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all four dev servers concurrently |
| `npm run build` | Build all four packages for production |
| `npm run dev:shell` | Start only the shell (`:3000`) |
| `npm run dev:products` | Start only products (`:3001`) |
| `npm run dev:cart` | Start only cart (`:3002`) |
| `npm run dev:dashboard` | Start only dashboard (`:3003`) |

## Prerequisites

- Node.js 20+ (required for Tailwind CSS v4)
- npm 9+
- Modern browser (Chrome 111+, Firefox 128+, Safari 16.4+)

## License

MIT
