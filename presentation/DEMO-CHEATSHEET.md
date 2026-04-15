# Live Demo Cheat Sheet

Quick reference for the live coding portion of the talk.

---

## 1. Start the demo

```bash
npm run ports:check
npm run dev
# Opens 4 dev servers concurrently:
#   Shell      → http://localhost:3000
#   Products   → http://localhost:3001
#   Cart       → http://localhost:3002
#   Dashboard  → http://localhost:3003
```

---

## 2. Show streaming in action

1. Open `http://localhost:3000`
2. Call out the redirect to `/products`
3. Observe the **products skeleton** (2.5s delay)
4. Click **Cart** tab → cart skeleton (3.5s delay)
5. Click **Dashboard** tab → dashboard skeleton (5s delay)
6. Explain: "Each remote controls its own loading time. The shell has zero knowledge of it."

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

## 4. Demonstrate fault isolation

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

1. Click through **Dark → Dim → Light** buttons in the header
2. Show that all remote modules react to the theme change
3. Open DevTools → Application → Local Storage → show `mf-demo-theme` key
4. Refresh the page → theme persists
5. Explain: "The shell owns theme state, persists it, and broadcasts changes via CSS variables + a typed window event."

---

## 6. Show prefetching

1. Open DevTools → Network tab
2. Hover over **Cart** tab (don't click)
3. Show `remoteEntry.js` being fetched in the background
4. Click Cart → loads instantly (already prefetched)
5. Explain: "On hover, we fire a bare `import()` that fetches the remote entry in the background."

---

## 7. Code walkthrough — Key files to show

### The streaming pattern (12 lines)
```
packages/products/src/StreamingProductsCatalog.tsx
```
Show: `resource.read()` throws a Promise → Suspense catches it → skeleton displays

### Shell composition (3 layers of resilience)
```
packages/shell/src/App.tsx
```
Show: `lazy()` + `.catch()` → `<Suspense>` → `<ErrorBoundary>`

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
# 57 tests across 4 packages — all green
```

Show the vitest.config.ts alias trick:
```ts
// Resolve MF remote imports to actual source files
"products/StreamingProductsCatalog": path.resolve(
  __dirname, "packages/products/src/StreamingProductsCatalog.tsx"
),
```

---

## 9. Fallback: Static screenshots

If wifi/demo gods fail, have screenshots of:
- [ ] Full products grid loaded
- [ ] Cart with items
- [ ] Dashboard stats
- [ ] ModuleFallback when remote is down
- [ ] Theme switching (dark → light)
- [ ] Terminal showing all tests passing

---

## Quick commands

| Action | Command |
|---|---|
| Check demo ports | `npm run ports:check` |
| Start all servers | `npm run dev` |
| Run all tests | `npm test` |
| Test with coverage | `npm run test:coverage` |
| Build all packages | `npm run build` |
| Lint all packages | `npm run lint` |
| Type check all | `npm run typecheck` |
| Start single remote | `cd packages/products && npm run dev` |
