# Cart — Remote Module

The cart micro-frontend provides shopping cart management. It exposes `ShoppingCart` (instant render) and `StreamingShoppingCart` (Suspense-wrapped with simulated delay). It listens for `addToCart` events from the products module.

Runs on **localhost:3002**.

## Exposed Modules

```js
exposes: {
  "./ShoppingCart":          "./src/ShoppingCart.tsx",
  "./StreamingShoppingCart": "./src/StreamingShoppingCart.tsx",
}
```

## File Structure

```
cart/
├── rspack.config.js           # MF remote — name: "cart", port: 3002
├── postcss.config.js          # @tailwindcss/postcss
├── tsconfig.json
├── public/index.html          # Standalone dev page
└── src/
    ├── index.tsx              # Standalone bootstrap
    ├── ShoppingCart.tsx       # Full cart with management
    ├── ShoppingCart.test.tsx  # Cart behavior tests
    ├── StreamingShoppingCart.tsx # Resource + Suspense wrapper
    ├── index.css              # @theme tokens, animations
    ├── types.ts               # CartItem, events
    └── lib/
        └── utils.ts           # cn() utility
```

## Key Types

```typescript
interface CartItem {
  readonly id: number;
  readonly name: string;
  readonly price: number;
  readonly quantity: number;
}

interface AddToCartEvent extends CustomEvent {
  detail: CartItem;
}
```

## Features

- **Table-like layout** — monospace column headers (Product, Qty, Total), bordered rows
- **Inline quantity controls** — connected `−` / count / `+` cells with border dividers
- **Order summary sidebar** — sticky panel with subtotal, shipping (free), tax, total in large serif italic
- **Citrine checkout button** — `bg-citrine text-ink` with full-width emphasis
- **Empty cart state** — serif italic heading with a working "Browse Products →" CTA that requests host-owned navigation
- **Cross-module event listening** — adds items when `addToCart` fires from products

## Event Handling

The cart registers an event listener on mount:

```typescript
useEffect(() => {
  const handleAddToCart = (event: AddToCartEvent) => {
    const cartItem = event.detail;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === cartItem.id);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItem.id
            ? { ...item, quantity: item.quantity + cartItem.quantity }
            : item
        );
      }
      return [...prev, cartItem];
    });
  };
  window.addEventListener("addToCart", handleAddToCart);
  return () => window.removeEventListener("addToCart", handleAddToCart);
}, []);
```

If the product already exists in the cart, its quantity is incremented. Otherwise it's appended.

When the cart becomes empty, the CTA dispatches a navigation request instead of trying to import the shell router directly:

```typescript
window.dispatchEvent(
  new CustomEvent("navigateToModule", {
    detail: { module: "products" },
  })
);
```

That keeps routing host-owned while still letting the remote drive the user back into the main shopping flow.

## Initial Mock Data

The cart starts with two pre-loaded items for demo purposes:

| Item | Price | Qty |
|------|-------|-----|
| MacBook Pro M3 | $2,499.99 | 1 |
| AirPods Pro | $249.99 | 2 |

## Streaming Pattern

Same Resource pattern as other remotes — `getResource("cart-initial", 3500)` delays 3.5 seconds for the shell's skeleton to display.

## Development

```bash
npm run dev    # Starts on :3002
npm run build  # Production build
npm run lint   # Lint cart source through the workspace ESLint config
npm run typecheck
npm run test
```

## Testing

`ShoppingCart.test.tsx` covers initial cart rendering, quantity controls, item removal, order summary calculations, `addToCart` event listener, checkout notification, and the empty-state navigation request. The package also exposes `lint`, `typecheck`, and `test` scripts for isolated quality checks. Run from the repo root:

```bash
npm test
```
