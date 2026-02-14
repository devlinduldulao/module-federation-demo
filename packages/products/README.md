# Products — Remote Module

The products micro-frontend provides a filterable product catalog. It exposes two components via Module Federation: `ProductsCatalog` (renders immediately) and `StreamingProductsCatalog` (wraps the catalog in a Resource-based Suspense delay to simulate a slow API).

Runs on **localhost:3001**.

## Exposed Modules

```js
exposes: {
  "./ProductsCatalog":          "./src/ProductsCatalog.tsx",
  "./StreamingProductsCatalog": "./src/StreamingProductsCatalog.tsx",
}
```

The shell imports `StreamingProductsCatalog` — when the Resource resolves after the simulated delay, the full catalog renders inside the shell's `<Suspense>` boundary.

## File Structure

```
products/
├── rspack.config.js           # MF remote — name: "products", port: 3001
├── postcss.config.js          # @tailwindcss/postcss
├── tsconfig.json
├── public/index.html           # Standalone dev page
└── src/
    ├── index.tsx               # Standalone bootstrap (renders ProductsCatalog)
    ├── ProductsCatalog.tsx     # Full catalog with filters + grid
    ├── StreamingProductsCatalog.tsx  # Resource + Suspense wrapper
    ├── index.css               # @theme tokens, animations
    ├── types.ts                # Product, CartItem, FilterCategory, events
    └── lib/
        └── utils.ts            # cn() utility
```

## Key Types

```typescript
interface Product {
  readonly id: number;
  readonly name: string;
  readonly price: number;
  readonly image?: string;
  readonly category: string;
  readonly description: string;
}

type FilterCategory = "all" | "electronics" | "clothing" | "books";
```

## Features

- **Category filter bar** — monospace uppercase tabs with citrine underline on active
- **1px editorial grid** — `gap-[1px] bg-edge` creates sharp dividing lines between cards
- **Product cards** — aspect-square image placeholder, serif italic name, mono price, "Add →" button
- **Citrine hover line** — 2px bar scales in from left on card image hover
- **Staggered animations** — each card fades in with incremental delay
- **Add to cart** — dispatches `addToCart` CustomEvent + `showNotification` for the shell toast

## Inter-Module Communication

When a user clicks "Add →", the component dispatches:

```typescript
window.dispatchEvent(new CustomEvent("addToCart", {
  detail: { id: product.id, name: product.name, price: product.price, quantity: 1 },
  bubbles: true,
}));

window.dispatchEvent(new CustomEvent("showNotification", {
  detail: { type: "success", message: `${product.name} added to cart` },
}));
```

The cart module listens for `addToCart`. The shell listens for `showNotification`.

## Streaming Pattern

`StreamingProductsCatalog` uses the Resource pattern:

```typescript
const StreamingProductsCatalog = () => {
  const resource = getResource("products-initial", 5000); // 5s simulated delay
  resource.read(); // Throws a Promise for Suspense if pending
  return <ProductsCatalog />;
};
```

The shell's `<Suspense fallback={<ProductsSkeleton />}>` catches the thrown promise and shows the skeleton until the resource resolves.

## Development

```bash
npm run dev    # Starts on :3001
npm run build  # Production build
```

Visit `http://localhost:3001` to see the catalog standalone. The shell at `:3000` loads this module's `remoteEntry.js` automatically.
