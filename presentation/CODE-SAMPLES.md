# Code Samples — Conference Reference

Annotated code snippets for projection during the talk. Each block is self-contained and presentation-ready.

---

## 1. The Streaming Resource Pattern

The entire pattern that makes Suspense work inside federated remotes:

```tsx
// StreamingProductsCatalog.tsx — 65 lines total, pattern is ~40

import ProductsCatalog from "./ProductsCatalog";

// Simulate a network fetch
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The Resource pattern — a synchronous read() that throws for Suspense
interface Resource<T> {
  read(): T;
}

function createResource<T>(asyncFn: () => Promise<T>): Resource<T> {
  let status: "pending" | "success" | "error" = "pending";
  let result: T;

  const suspender = asyncFn().then(
    (data) => { status = "success"; result = data; },
    (error) => { status = "error"; result = error; }
  );

  return {
    read() {
      if (status === "pending") throw suspender; // ← Suspense catches this!
      if (status === "error") throw result;
      return result;
    },
  };
}

// Cache so re-renders don't re-create the resource
const resourceCache = new Map<string, Resource<void>>();

function getResource(key: string, delayMs: number): Resource<void> {
  if (!resourceCache.has(key)) {
    resourceCache.set(key, createResource(() => delay(delayMs)));
  }
  return resourceCache.get(key)!;
}

// THE STREAMING WRAPPER — this is the only thing the shell imports
const StreamingProductsCatalog = () => {
  const resource = getResource("products-initial", 2500);
  resource.read(); // Throws a Promise while pending → triggers Suspense
  return <ProductsCatalog />;
};

export default StreamingProductsCatalog;
```

---

## 2. Shell Composition — Three Layers of Resilience

```tsx
// packages/shell/src/App.tsx

// Layer 1: lazy() + .catch() — handles unreachable remotes
const StreamingProductsCatalog = lazy(() =>
  import("products/StreamingProductsCatalog").catch((error) => {
    console.error("Failed to load:", error);
    return {
      default: () => (
        <ModuleFallback
          title="Products Module Unavailable"
          message="The products service is currently unavailable."
        />
      ),
    };
  })
);

// Layer 2 + 3: Suspense + ErrorBoundary
function ModuleView({ module }: { module: ModuleConfig }) {
  const Component = module.component;
  return (
    <ErrorBoundary>                           {/* Layer 3: catches runtime errors */}
      <Suspense fallback={<ProductsSkeleton />}> {/* Layer 2: shows skeleton */}
        <Component />                            {/* Layer 1: lazy-loaded remote */}
      </Suspense>
    </ErrorBoundary>
  );
}
```

---

## 3. Cross-Module Communication

### Producer (Products module)

```tsx
// When user clicks "Add to Cart"
const handleAddToCart = (product: Product) => {
  // Tell the cart module
  window.dispatchEvent(new CustomEvent("addToCart", {
    detail: {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    },
  }));

  // Tell the shell to show a toast
  window.dispatchEvent(new CustomEvent("showNotification", {
    detail: {
      type: "success",
      message: `${product.name} added to cart`,
    },
  }));
};
```

### Consumer (Cart module)

```tsx
// Cart listens for addToCart events
useEffect(() => {
  const handleAddToCart = (event: AddToCartEvent) => {
    const item = event.detail;
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  window.addEventListener("addToCart", handleAddToCart);
  return () => window.removeEventListener("addToCart", handleAddToCart);
}, []);
```

### Host-owned navigation request (Cart module)

```tsx
// Empty cart CTA asks the shell to navigate instead of importing react-router-dom
const handleBrowseProducts = () => {
  window.dispatchEvent(
    new CustomEvent("navigateToModule", {
      detail: { module: "products" },
    })
  );
};
```

---

## 4. Module Federation Config

### Remote (exposes modules)

```js
// packages/products/rspack.config.js
new rspack.container.ModuleFederationPlugin({
  name: "products",
  filename: "remoteEntry.js",
  exposes: {
    "./ProductsCatalog":          "./src/ProductsCatalog.tsx",
    "./StreamingProductsCatalog": "./src/StreamingProductsCatalog.tsx",
  },
  shared: {
    react:       { singleton: true, requiredVersion: "^19.2.5" },
    "react-dom": { singleton: true, requiredVersion: "^19.2.5" },
  },
});
```

### Host (consumes remotes)

```js
// packages/shell/rspack.config.js
new rspack.container.ModuleFederationPlugin({
  name: "shell",
  remotes: {
    products:  "products@http://localhost:3001/remoteEntry.js",
    cart:      "cart@http://localhost:3002/remoteEntry.js",
    dashboard: "dashboard@http://localhost:3003/remoteEntry.js",
  },
  shared: {
    react:              { singleton: true },
    "react-dom":        { singleton: true },
    "react-dom/client": { singleton: true },
  },
});
```

---

## 5. Theme System

### Shell — theme owner

```tsx
// packages/shell/src/lib/theme.ts

export function applyTheme(theme: ThemeName): void {
  const definition = THEME_DEFINITIONS[theme];
  const root = document.documentElement;

  // Apply CSS variables
  root.dataset.theme = theme;
  for (const [variable, value] of Object.entries(definition.variables)) {
    root.style.setProperty(variable, value);
  }

  // Expose bridge for remotes
  window.__MF_THEME__ = {
    getTheme: () => theme,
    setTheme: (next) => applyTheme(next),
  };

  // Persist
  localStorage.setItem("mf-demo-theme", theme);

  // Broadcast to all remotes
  window.dispatchEvent(new CustomEvent("themeChange", {
    detail: { theme, colorScheme: definition.colorScheme },
  }));
}
```

### Remote — theme consumer

```tsx
// packages/products/src/lib/theme.ts

export function useActiveTheme() {
  const [theme, setTheme] = useState<ThemeName>(() => {
    // Try host bridge first, fallback to localStorage
    return window.__MF_THEME__?.getTheme() ?? "dark";
  });

  useEffect(() => {
    const handler = (e: WindowEventMap["themeChange"]) => {
      setTheme(e.detail.theme);
    };
    window.addEventListener("themeChange", handler);
    return () => window.removeEventListener("themeChange", handler);
  }, []);

  return { theme, label: THEME_LABELS[theme] };
}
```

---

## 6. Typed Event Contracts

```tsx
// packages/products/src/types.ts

export interface AddToCartEvent extends CustomEvent {
  detail: {
    readonly id: number;
    readonly name: string;
    readonly price: number;
    readonly quantity: number;
  };
}

export interface ThemeChangeEvent extends CustomEvent {
  detail: {
    theme: "dark" | "dim" | "light";
    colorScheme: "dark" | "light";
  };
}

// Augment the global WindowEventMap — no shared package needed
declare global {
  interface WindowEventMap {
    addToCart: AddToCartEvent;
    navigateToModule: CustomEvent<{ module: "products" | "cart" | "dashboard" }>;
    showNotification: NotificationEvent;
    themeChange: ThemeChangeEvent;
  }
}
```

---

## 7. Testing Federated Components

### Vitest config — the alias trick

```ts
// vitest.config.ts
resolve: {
  alias: {
    // Resolve MF remote imports to actual source files
    "products/StreamingProductsCatalog": path.resolve(
      __dirname, "packages/products/src/StreamingProductsCatalog.tsx"
    ),
    "cart/StreamingShoppingCart": path.resolve(
      __dirname, "packages/cart/src/StreamingShoppingCart.tsx"
    ),
    "dashboard/StreamingUserDashboard": path.resolve(
      __dirname, "packages/dashboard/src/StreamingUserDashboard.tsx"
    ),
    // Pin React to one copy
    react: path.join(rootNodeModules, "react"),
    "react-dom": path.join(rootNodeModules, "react-dom"),
  },
}
```

### Component test — event verification

```tsx
it("dispatches addToCart event on Add click", async () => {
  const handler = vi.fn();
  window.addEventListener("addToCart", handler);

  render(<ProductsCatalog />);
  await user.click(
    screen.getByRole("button", { name: /add MacBook Pro M3 to cart/i })
  );

  expect(handler).toHaveBeenCalledTimes(1);
  expect(handler.mock.calls[0][0].detail).toEqual({
    id: 1,
    name: "MacBook Pro M3",
    price: 2499.99,
    quantity: 1,
  });

  window.removeEventListener("addToCart", handler);
});
```

---

## 8. Prefetching

```tsx
// Prefetch map — bare import() calls cached by the bundler
const PREFETCHERS: Record<ModuleType, () => Promise<unknown>> = {
  products:  () => import("products/StreamingProductsCatalog").catch(() => undefined),
  cart:      () => import("cart/StreamingShoppingCart").catch(() => undefined),
  dashboard: () => import("dashboard/StreamingUserDashboard").catch(() => undefined),
};

// Trigger on hover — no router library required
<NavLink
  to={module.path}
  onMouseEnter={() => PREFETCHERS[module.id]()}
>
  {module.label}
</NavLink>
```
