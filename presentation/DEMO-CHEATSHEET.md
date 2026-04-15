# Live Demo Cheat Sheet

Quick reference for the live coding portion of the talk.

> **Two pillars to demonstrate:**
> 1. **DX** — Module Federation gives growing teams independent builds, deploys, and onboarding
> 2. **UX** — Suspense streaming + skeletons give visitors instant perceived load

---

## 1. Start the demo

```bash
npm run dev
# Opens 5 dev servers concurrently:
#   Shell      → http://localhost:3000
#   Products   → http://localhost:3001
#   Cart       → http://localhost:3002
#   Dashboard  → http://localhost:3003
#   Home       → http://localhost:3004
```

---

## 2. Show loading strategies in action (UX pillar)

1. Open `http://localhost:3000`
2. See the **Home** landing page — loads **instantly** (no skeleton delay). Status strip shows **INSTANT** with a green dot.
3. Click **Products** → loads fast because it was **eagerly preloaded** on shell mount. Status strip shows **EAGER** with a yellow dot.
4. Click **Cart** tab → observe the **cart skeleton** streaming in (3.5s delay). Status strip shows **STREAMING** with an orange dot.
5. Click **Dashboard** tab → dashboard skeleton streams in (5s delay)
6. Explain: "Three loading strategies for three content priorities. Home is instant — no streaming delay, the landing page renders the moment the chunk arrives. Products is eager — preloaded on shell mount so it’s cached before you click. Cart and Dashboard are streamed — loaded on demand with skeleton fallbacks."
7. Mention: "The DX pillar is what you can't see — each of these modules is a separate app, built and deployed by a separate team, running on its own dev server."

### Loading strategy taxonomy

| Strategy | Module | When it loads | Status strip |
|----------|--------|--------------|---------------|
| **Instant** | Home | Chunk fetched lazily, no streaming delay | 🟢 INSTANT |
| **Eager** | Products | Preloaded on shell mount via `EAGER_PRELOAD`, no streaming delay | 🟡 EAGER |
| **Streamed** | Cart, Dashboard | On demand with skeleton streaming | 🟠 STREAMING |

> **Anticipate the question: "Why `lazy()` if it's eager?"** — Module Federation remotes are separate builds on separate servers, resolved at runtime via `import()`. You can't use a static `import`. The eager pattern fires `import()` at shell init to cache the chunk; `lazy()` later resolves from that cache instantly — no skeleton, no delay. The test *"renders products immediately without a skeleton"* proves it.

---

## 3. Show cross-module communication

1. Navigate to **Products**
2. Click **Add →** on "MacBook Pro M3"
3. Observe toast notification: "MacBook Pro M3 added to cart"
4. Navigate to **Cart**
5. Show that MacBook Pro M3 was added (via `addToCart` CustomEvent)
6. Remove both items from the cart
7. Click **Browse Products →**
8. Explain: "The cart remote requested navigation through a typed window event. The shell still owns the router."

---

## 4. Demonstrate fault isolation (DX + UX)

### Option A: Federation Lab (recommended for live demo)

1. Click the **Lab** button in the header (or `Ctrl+K` → "Open Federation Lab")
2. Show the **Remote Health Monitor** — all 4 remotes green with latency
3. Toggle the **Kill Switch** for products → products shows `ModuleFallback`
4. Navigate to Cart → works fine
5. Navigate to Dashboard → works fine
6. Note the status bar showing "1 KILLED"
7. Click **Restore All** in the Lab panel
8. Explain: "This is where DX and UX meet. Each team deploys independently — that's the DX benefit. When one team's deploy breaks, the user still sees the rest of the app — that's the UX benefit. ErrorBoundary catches it and other modules keep running."

### Option B: Real server kill

1. In terminal, stop the products dev server (Ctrl+C on the products process)
2. In the browser, navigate to Products tab
3. Show **ModuleFallback** component: "Products Module Unavailable"
4. Navigate to Cart → works fine
5. Navigate to Dashboard → works fine
6. Restart products server
7. Navigate back to Products → it loads again
8. Explain: "One broken module never takes down the shell."

---

## 5. Theme switching

1. Click through **Dark → Light** buttons in the header
2. Show that all remote modules react to the theme change
3. Open DevTools → Application → Local Storage → show `mf-demo-theme` key
4. Refresh the page → theme persists
5. Explain: "The shell owns theme state, persists it, and broadcasts changes via CSS variables + a typed window event."

---

## 5b. A/B deployment demo (Federation Lab)

1. Open the Federation Lab (click **Lab**)
2. Show the **A/B Deployment** section — all modules on "Stable Ring"
3. Click to toggle to **Canary Ring**
4. Show version info changing per module (e.g., products 2.1.0 → 2.2.0-canary.1)
5. Note the status bar now shows "CANARY" indicator
6. Explain: "Each remote can be deployed independently at different versions. The shell orchestrates which ring to consume."

---

## 6. Show prefetching

1. Open DevTools → Network tab
2. Hover over **Cart** tab (don't click)
3. Show `remoteEntry.js` being fetched in the background
4. Click Cart → loads instantly (already prefetched)
5. Explain: "On hover, we fire a bare `import()` that fetches the remote entry in the background."

---

## 7. Code walkthrough — Key files to show

### DX story: independent module structure
```
packages/products/
  package.json         ← own dependencies, own scripts
  rspack.config.js     ← own MF config, own dev server on :3001
  tsconfig.json        ← own TS config
  src/
    ProductsCatalog.tsx ← standalone component (runs without the shell)
```
Explain: "Every module is a self-contained app. A new team copies a package, picks a port, and ships independently."

### UX story: loading strategy taxonomy
```
packages/shell/src/App.tsx
```
Show: Three strategies — `Home` imports `home/Home` directly (instant), `Products` imports `products/ProductsCatalog` directly and is eagerly preloaded at shell init, `Cart`/`Dashboard` are streamed on demand

### UX story: the streaming pattern (12 lines)
```
packages/cart/src/StreamingShoppingCart.tsx
```
Show: `resource.read()` throws a Promise → Suspense catches it → skeleton displays instantly

### Shell composition (3 layers of resilience + kill switch + load strategy)
```
packages/shell/src/App.tsx
```
Show: `lazy()` + `.catch()` → `<Suspense>` → `<ErrorBoundary>` → kill switch check in `ModuleView`. Also show `loadStrategy` field on `ModuleConfig` and the status strip that shows INSTANT/EAGER/STREAMING per module.

### Event contract
```
packages/products/src/types.ts
```
Show: `WindowEventMap` with typed `addToCart` and `showNotification` events

### Host-owned navigation request
```
packages/cart/src/ShoppingCart.tsx
```
Show: empty-state CTA dispatches `navigateToModule` instead of importing the shell router

### Theme bridge
```
packages/products/src/lib/theme.ts
```
Show: `useActiveTheme()` hook — reads from host bridge, listens for `themeChange`

---

## 8. Run the test suite

```bash
npm test
# 137 tests across 10 files — all green
```

Show the vitest.config.ts alias trick:
```ts
// Resolve MF remote imports to actual source files
"home/Home": path.resolve(
  __dirname, "packages/home/src/Home.tsx"
),
"products/ProductsCatalog": path.resolve(
  __dirname, "packages/products/src/ProductsCatalog.tsx"
),
```

---

## 9. Fallback: Static screenshots

If wifi/demo gods fail, have screenshots of:
- [ ] Home landing page with architecture cards
- [ ] Full products grid loaded
- [ ] Cart with items
- [ ] Dashboard stats
- [ ] Federation Lab panel with health monitor
- [ ] ModuleFallback when remote is killed
- [ ] Theme switching (dark → light)
- [ ] Terminal showing all tests passing

---

## Quick commands

| Action | Command |
|---|---|
| Start all servers | `npm run dev` |
| Run all tests | `npm test` |
| Test with coverage | `npm run test:coverage` |
| Build all packages | `npm run build` |
| Kill all demo ports | `npm run kill:ports` |
| Kill single remote | `npm run kill:products` / `kill:cart` / `kill:dashboard` / `kill:home` |
| Start single remote | `cd packages/products && npm run dev` |
