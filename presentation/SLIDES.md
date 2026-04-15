# Streaming Micro-Frontends: React 19 Suspense Meets Module Federation

> A 30-minute conference talk with live demo  
> Built with: React 19 · Rspack · Module Federation · TypeScript 6 · Tailwind CSS v4

---

## Slide 1 — Title

# Streaming Micro-Frontends

### React 19 Suspense Meets Module Federation

```
Shell (host)    :3000
├── Products    :3001
├── Cart        :3002
└── Dashboard   :3003
```

*"What happens when you stop treating Suspense and Module Federation as separate ideas?"*

---

## Slide 2 — The Problem

### Monolith → Micro-Frontends

| Monolith Pain | MF Solution |
|---|---|
| One broken deploy takes down everything | Fault isolation per module |
| Teams blocked by shared release cycles | Independent deployment |
| Massive bundle shipped to every user | Load only what's needed |
| "Works on my machine" integration hell | Each module runs standalone |

**But micro-frontends have their own problem:**  
How do you make independently deployed modules feel like a single, seamless app?

---

## Slide 3 — The Insight

### Suspense Is a Micro-Frontend Primitive

```
Before: Shell manages loading state for every remote
         ↓ isLoading props ↓ loading spinners ↓ orchestration logic

After:  Each remote owns its own loading choreography
         ↓ Suspense boundary ↓ skeleton fallback ↓ zero coupling
```

> **The shell doesn't know or care how long a remote takes to load.**  
> It just renders `<Suspense>` and moves on.

---

## Slide 4 — Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   SHELL (:3000)                     │
│                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐ │
│  │ Nav     │  │ Theme   │  │ Status Strip         │ │
│  │ Router  │  │ Control │  │ STREAMING | module   │ │
│  └─────────┘  └─────────┘  └─────────────────────┘ │
│                                                     │
│  ┌─────────────────────────────────────────────────┐ │
│  │           <ErrorBoundary>                       │ │
│  │             <Suspense fallback={<Skeleton />}>  │ │
│  │               <RemoteModule />                  │ │
│  │             </Suspense>                         │ │
│  │           </ErrorBoundary>                      │ │
│  └─────────────────────────────────────────────────┘ │
│                                                     │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Footer: Independent Deploy / Zero Coupling      │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
         │              │              │
    ┌────┴────┐   ┌────┴────┐   ┌────┴────┐
    │Products │   │  Cart   │   │Dashboard│
    │ :3001   │   │ :3002   │   │  :3003  │
    └─────────┘   └─────────┘   └─────────┘
```

---

## Slide 5 — Tech Stack

| Technology | Version | Why |
|---|---|---|
| **React** | 19.2 | Streaming Suspense as a first-class primitive |
| **Rspack** | 1.7 | Native Module Federation, sub-second HMR |
| **TypeScript** | 6.0 | Strict mode, type-safe event contracts |
| **Tailwind CSS** | v4 | `@theme` tokens for the design system |
| **Vitest** | 4.1 | Fast component tests with jsdom |

---

## Slide 6 — Module Federation Config

### Remote (exposes)

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
    react:       { singleton: true, strictVersion: false },
    "react-dom": { singleton: true, strictVersion: false },
  },
});
```

### Host (consumes)

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
    react:       { singleton: true, strictVersion: false },
    "react-dom": { singleton: true, strictVersion: false },
  },
});
```

**Key:** `singleton: true` ensures one React instance across all modules — no "Invalid hook call" errors.

---

## Slide 7 — The Resource Pattern

### How streaming works inside a federated remote

```tsx
// StreamingProductsCatalog.tsx

import ProductsCatalog from "./ProductsCatalog";

function createResource<T>(asyncFn: () => Promise<T>): Resource<T> {
  let status = "pending";
  let result: T;

  const suspender = asyncFn().then(
    (data) => { status = "success"; result = data; },
    (error) => { status = "error"; result = error; }
  );

  return {
    read() {
      if (status === "pending") throw suspender;  // ← Suspense catches this
      if (status === "error") throw result;
      return result;
    },
  };
}

const StreamingProductsCatalog = () => {
  const resource = getResource("products-initial", 2500);
  resource.read();  // Throws promise → triggers <Suspense> in the shell
  return <ProductsCatalog />;
};
```

> The streaming wrapper's ONLY job is to trigger Suspense.  
> The actual UI lives in the standalone component.

---

## Slide 8 — Shell Composition

### How the shell stays ignorant of remote internals

```tsx
// Shell App.tsx

const StreamingProductsCatalog = lazy(() =>
  import("products/StreamingProductsCatalog").catch((error) => ({
    default: () => <ModuleFallback title="Products Unavailable" />,
  }))
);

// In the render:
<ErrorBoundary>
  <Suspense fallback={<ProductsSkeleton />}>
    <StreamingProductsCatalog />
  </Suspense>
</ErrorBoundary>
```

**Three layers of resilience:**
1. `lazy()` + `.catch()` → fallback if remote is unreachable
2. `<Suspense>` → skeleton while loading
3. `<ErrorBoundary>` → catches runtime errors in the remote

---

## Slide 9 — Fault Isolation

### DEMO: Kill a remote server

```bash
# Stop the products dev server
# The shell keeps running — shows ModuleFallback
# Cart and Dashboard are unaffected
```

```tsx
// lazy() with .catch() — the secret sauce
const StreamingProductsCatalog = lazy(() =>
  import("products/StreamingProductsCatalog").catch(() => ({
    default: () => (
      <ModuleFallback
        title="Products Module Unavailable"
        message="The products service is currently unavailable."
      />
    ),
  }))
);
```

> **One team's broken deploy never takes down the entire application.**

---

## Slide 10 — Cross-Module Communication

### Events > Shared State

```
Products                Shell               Cart
   │                      │                   │
   ├─ addToCart ──────────►│                   │
   │                      ├─ showNotification─►│ (toast)
   │                      │                   ├── updates cart state
   │                      │                   │
```

```tsx
// Products dispatches
window.dispatchEvent(new CustomEvent("addToCart", {
  detail: { id: 1, name: "MacBook Pro M3", price: 2499.99, quantity: 1 },
}));

// Cart listens
useEffect(() => {
  const handler = (e: CustomEvent) => {
    setCartItems(prev => [...prev, e.detail]);
  };
  window.addEventListener("addToCart", handler);
  return () => window.removeEventListener("addToCart", handler);
}, []);
```

**Why CustomEvents?**
- Zero coupling — modules don't import each other
- Survives independent deployments and version mismatches
- Works across any framework (React, Vue, Svelte)
- Easy to type with TypeScript's `WindowEventMap`

---

## Slide 11 — Typed Event Contracts

### TypeScript makes events safe

```tsx
// types.ts — shared across all remotes

interface AddToCartEvent extends CustomEvent {
  detail: {
    readonly id: number;
    readonly name: string;
    readonly price: number;
    readonly quantity: number;
  };
}

declare global {
  interface WindowEventMap {
    addToCart: AddToCartEvent;
    showNotification: NotificationEvent;
    themeChange: ThemeChangeEvent;
    moduleChange: CustomEvent<{ newModule: string }>;
  }
}
```

> Each remote defines the same event shapes in its own `types.ts`.  
> No shared npm package needed.

---

## Slide 12 — Theme System

### Shell-owned theming across the federation

```
Shell (owns theme)
  │
  ├── Persists to localStorage ("mf-demo-theme")
  ├── Applies CSS variables to document.documentElement
  ├── Exposes window.__MF_THEME__
  └── Broadcasts "themeChange" event
        │
        ├── Products → useActiveTheme() hook
        ├── Cart     → useActiveTheme() hook
        └── Dashboard → useActiveTheme() hook
```

```tsx
// Remote's useActiveTheme hook
export function useActiveTheme() {
  const [theme, setTheme] = useState(() => {
    // 1. Try host bridge: window.__MF_THEME__?.getTheme()
    // 2. Fallback: localStorage
    // 3. Default: "dark"
  });

  useEffect(() => {
    window.addEventListener("themeChange", (e) => {
      setTheme(e.detail.theme);
    });
  }, []);

  return { theme, label: THEME_LABELS[theme] };
}
```

**Three themes:** Dark (editorial noir) · Dim (low-glare) · Light (warm paper)

---

## Slide 13 — Prefetching

### Load modules before the user clicks

```tsx
const PREFETCHERS: Record<ModuleType, () => Promise<unknown>> = {
  products:  () => import("products/StreamingProductsCatalog").catch(() => undefined),
  cart:      () => import("cart/StreamingShoppingCart").catch(() => undefined),
  dashboard: () => import("dashboard/StreamingUserDashboard").catch(() => undefined),
};

// On tab hover → prefetch
<NavLink
  onMouseEnter={() => PREFETCHERS[module.id]()}
>
```

> The remote entry JS is fetched on hover.  
> When clicked, the module loads instantly.

---

## Slide 14 — Testing Strategy

### How to test federated components in isolation

```ts
// vitest.config.ts — resolve MF imports to source files
resolve: {
  alias: {
    "products/StreamingProductsCatalog": path.resolve(
      __dirname, "packages/products/src/StreamingProductsCatalog.tsx"
    ),
    "cart/StreamingShoppingCart": path.resolve(
      __dirname, "packages/cart/src/StreamingShoppingCart.tsx"
    ),
    // ...
  },
}
```

```tsx
// ProductsCatalog.test.tsx
it("dispatches addToCart event on Add click", async () => {
  const handler = vi.fn();
  window.addEventListener("addToCart", handler);

  render(<ProductsCatalog />);
  await user.click(screen.getByRole("button", { name: /add MacBook Pro M3/i }));

  expect(handler).toHaveBeenCalledTimes(1);
  expect(handler.mock.calls[0][0].detail).toEqual({
    id: 1, name: "MacBook Pro M3", price: 2499.99, quantity: 1,
  });
});
```

**57 tests across 4 packages — all passing.**

---

## Slide 15 — Design System: Noir Editorial

### A design language that doesn't look like generic AI

| Element | Treatment |
|---|---|
| **Typography** | Instrument Serif (display) · DM Sans (body) · IBM Plex Mono (labels) |
| **Grid** | `gap-[1px] bg-edge` — sharp 1px editorial grid lines |
| **Accent** | Citrine `#D4FF00` — navigation, CTAs, active states |
| **Animations** | `fadeInUp` with staggered delays, `shimmer` on skeletons |
| **Grain** | SVG noise overlay at 2.5% opacity |

### Three palettes

| Dark | Dim | Light |
|---|---|---|
| `#0C0C0C` noir | `#181412` warm dark | `#F3EEE3` paper |
| High contrast | Reduced glare | Editorial warmth |

---

## Slide 16 — Live Demo Script

### 1. Full federation (2 min)
- Open `localhost:3000` — shell loads, products stream in with skeleton
- Click between tabs — observe skeletons and streaming delays
- Add product to cart — toast notification + cart sync

### 2. Fault isolation (1 min)
- Kill the products dev server (`Ctrl+C`)
- Shell shows `ModuleFallback` — cart and dashboard still work
- Restart products — module comes back

### 3. Theme switching (1 min)
- Toggle Dark → Dim → Light in the shell header
- Watch CSS variables update across all remotes
- Show localStorage persistence — refresh and theme persists

### 4. Code walkthrough (3 min)
- `StreamingProductsCatalog.tsx` — resource pattern (12 lines)
- `App.tsx` — lazy + catch + Suspense + ErrorBoundary
- Cross-module `addToCart` event flow

### 5. Testing (1 min)
- Run `npm test` — 57 tests, all green
- Show vitest.config.ts alias trick for MF imports

---

## Slide 17 — Key Takeaways

### 1. Suspense is a micro-frontend primitive
Each remote owns its loading state. The shell just renders `<Suspense>` — no loading spinners, no `isLoading` props.

### 2. Events > Shared state
`CustomEvent` on `window` gives you decoupled communication that survives independent deploys.

### 3. Fault isolation is a feature, not a side effect
`.catch()` on lazy imports + `ErrorBoundary` per module = one broken remote never kills the app.

### 4. Rspack makes this fast
Sub-second HMR in a monorepo with 4 applications. Module Federation is a first-class citizen.

### 5. The streaming wrapper pattern
```tsx
const StreamingComponent = () => {
  resource.read(); // throws for Suspense
  return <StandaloneComponent />;
};
```
That's it. The entire streaming pattern is 3 lines.

---

## Slide 18 — What We Didn't Cover (But You Should Explore)

- **Server-side rendering** with streaming Suspense + Module Federation
- **Shared design tokens** via a federated CSS module
- **Version negotiation** when remotes have different React versions
- **Deployment pipelines** — independent CI/CD per remote
- **Dynamic remote URLs** — loading remotes from a manifest at runtime
- **Nx/Turborepo** for build orchestration in larger monorepos

---

## Slide 19 — Resources

| Resource | URL |
|---|---|
| This demo repo | *github.com/[your-handle]/module-federation-demo* |
| Module Federation docs | module-federation.io |
| Rspack docs | rspack.dev |
| React 19 Suspense RFC | github.com/reactjs/rfcs |
| Vitest | vitest.dev |

---

## Slide 20 — Thank You

# Questions?

```
npm install && npm run dev
```

Open `localhost:3000` and start exploring.

---

## Speaker Notes

### Timing Guide (30 min total)
- **0:00–3:00** — Problem statement + architecture overview (slides 1–4)
- **3:00–6:00** — Tech stack + MF config (slides 5–6)
- **6:00–10:00** — Resource pattern + shell composition (slides 7–8)
- **10:00–18:00** — Live demo (slide 16 script)
- **18:00–22:00** — Cross-module communication + theme system (slides 10–13)
- **22:00–25:00** — Testing + design system (slides 14–15)
- **25:00–28:00** — Key takeaways (slide 17)
- **28:00–30:00** — Questions

### Demo Prep Checklist
- [ ] All 4 dev servers running (`npm run dev`)
- [ ] Browser at `localhost:3000`
- [ ] DevTools Network tab open (to show remoteEntry.js loads)
- [ ] Terminal split showing server logs
- [ ] Backup screenshots in case of wifi issues
- [ ] Font size bumped in editor (Ctrl/Cmd +)

### Audience Hooks
- "How many of you have a monolithic SPA that's becoming hard to deploy?"
- "Raise your hand if you've ever had a deploy break the entire app."
- "What if I told you the shell doesn't need to know anything about how long a remote takes to load?"
