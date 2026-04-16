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
#   Records    → http://localhost:3001
#   Prescriptions → http://localhost:3002
#   Analytics  → http://localhost:3003
#   Home       → http://localhost:3004
```

---

## 2. Shell controls walkthrough

Before diving into loading strategies, quickly orient the audience on the three control surfaces in the header:

### Settings button
1. Click **Settings** in the header
2. Show the slide-over drawer with Dark / Light theme options
3. Select **Light** → all modules immediately switch themes
4. Point out the footer showing `mf-demo-theme` localStorage key
5. Switch back to **Dark**
6. Explain: "The shell owns theme state. It rewrites CSS custom properties on `:root`, persists to `localStorage`, and dispatches a typed `themeChange` event. Every remote reacts without a page refresh or shared import."

### Commands button (Ctrl+K)
1. Press **Ctrl+K** (or click **Commands**)
2. Show the search overlay with all available commands
3. Type **"kill"** → filtered list shows kill/restore commands for each remote
4. Type **"dark"** → shows "Apply Dark Theme"
5. Type **"records"** → shows "Switch to Records"
6. Run a command from the palette (e.g., "Switch to Prescriptions")
7. Explain: "This is a VS Code–style command palette. During the live demo, you can navigate, kill remotes, toggle themes, and switch deployment rings — all from the keyboard, without hunting for buttons."

### Lab button (Federation Lab)
1. Click the **Lab** button (orange border) or press `Ctrl+K` → type "lab"
2. Walk through the four sections:
   - **Remote Health** — "Each dot polls `remoteEntry.js` every 5 seconds. Green means the remote is reachable."
   - **Kill Switches** — "I can take down any remote from here. The shell renders a fallback, other modules keep running."
   - **A/B Deployment** — "Toggle between stable and canary rings. Each module can be at a different version."
   - **Hot Reload Guide** — "Step-by-step instructions for the real server kill demo."
3. Close the panel
4. Explain: "The Lab is the demo centerpiece. It proves fault isolation, health monitoring, and independent versioning — all live."

> **Pro tip:** Every Lab action is also available in the command palette. During the talk, use `Ctrl+K` for quick actions and the Lab panel for the visual walkthrough.

---

## 3. Show loading strategies in action (UX pillar)

1. Open `http://localhost:3000`
2. See the **Home** landing page — loads **instantly** (no skeleton delay). Status strip shows **INSTANT** with a green dot.
3. Click **Records** → loads fast because it was **eagerly preloaded** on shell mount. Status strip shows **EAGER** with a yellow dot.
4. Click **Prescriptions** tab → observe the **prescriptions skeleton** streaming in (3.5s delay). Status strip shows **STREAMING** with an orange dot.
5. Click **Analytics** tab → analytics skeleton streams in (5s delay)
6. Explain: "Three loading strategies for three content priorities. Home is instant — no streaming delay, the landing page renders the moment the chunk arrives. Records is eager — preloaded on shell mount so it's cached before you click. Prescriptions and Analytics are streamed — loaded on demand with skeleton fallbacks."
7. Mention: "The DX pillar is what you can't see — each of these modules is a separate app, built and deployed by a separate team, running on its own dev server."

### Loading strategy taxonomy

| Strategy | Module | When it loads | Status strip |
|----------|--------|--------------|---------------|
| **Instant** | Home | Chunk fetched lazily, no streaming delay | 🟢 INSTANT |
| **Eager** | Records | Preloaded on shell mount via `EAGER_PRELOAD`, no streaming delay | 🟡 EAGER |
| **Streamed** | Prescriptions, Analytics | On demand with skeleton streaming | 🟠 STREAMING |

> **Anticipate the question: "Why `lazy()` if it's eager?"** — Module Federation remotes are separate builds on separate servers, resolved at runtime via `import()`. You can't use a static `import`. The eager pattern fires `import()` at shell init to cache the chunk; `lazy()` later resolves from that cache instantly — no skeleton, no delay. The test *"renders records immediately without a skeleton"* proves it.

---

## 4. Show cross-module communication

1. Navigate to **Records**
2. Click **Add →** on "Sarah Chen prescription"
3. Observe toast notification: "Sarah Chen prescription prescription created"
4. Navigate to **Prescriptions**
5. Show that Sarah Chen prescription was added (via `addPrescription` CustomEvent)
6. Remove both items from the prescriptions list
7. Click **Browse Records →**
8. Explain: "The prescriptions remote requested navigation through a typed window event. The shell still owns the router."

---

## 5. Demonstrate fault isolation (DX + UX)

### Option A: Federation Lab (recommended for live demo)

1. Click the **Lab** button in the header (or `Ctrl+K` → "Open Federation Lab")
2. Show the **Remote Health Monitor** — all 4 remotes green with latency
3. Toggle the **Kill Switch** for records → records shows `ModuleFallback`
4. Navigate to Prescriptions → works fine
5. Navigate to Analytics → works fine
6. Note the status bar showing "1 KILLED"
7. Click **Restore All** in the Lab panel
8. Explain: "This is where DX and UX meet. Each team deploys independently — that's the DX benefit. When one team's deploy breaks, the user still sees the rest of the app — that's the UX benefit. ErrorBoundary catches it and other modules keep running."

### Option B: Real server kill

1. In terminal, stop the records dev server (Ctrl+C on the records process)
2. In the browser, navigate to Records tab
3. Show **ModuleFallback** component: "Records Module Unavailable"
4. Navigate to Prescriptions → works fine
5. Navigate to Analytics → works fine
6. Restart records server
7. Navigate back to Records → it loads again
8. Explain: "One broken module never takes down the shell."

---

## 6. Theme switching

1. Click through **Dark → Light** buttons in the header
2. Show that all remote modules react to the theme change
3. Open DevTools → Application → Local Storage → show `mf-demo-theme` key
4. Refresh the page → theme persists
5. Explain: "The shell owns theme state, persists it, and broadcasts changes via CSS variables + a typed window event."

---

## 6b. A/B deployment demo (Federation Lab)

1. Open the Federation Lab (click **Lab**)
2. Show the **A/B Deployment** section — all modules on "Stable Ring"
3. Click to toggle to **Canary Ring**
4. Show version info changing per module (e.g., records 2.1.0 → 2.2.0-canary.1)
5. Note the status bar now shows "CANARY" indicator
6. Explain: "Each remote can be deployed independently at different versions. The shell orchestrates which ring to consume."

---

## 7. Show prefetching

1. Open DevTools → Network tab
2. Hover over **Prescriptions** tab (don't click)
3. Show `remoteEntry.js` being fetched in the background
4. Click Prescriptions → loads instantly (already prefetched)
5. Explain: "On hover, we fire a bare `import()` that fetches the remote entry in the background."

---

## 8. Code walkthrough — Key files to show

### DX story: independent module structure
```
packages/records/
  package.json         ← own dependencies, own scripts
  rspack.config.js     ← own MF config, own dev server on :3001
  tsconfig.json        ← own TS config
  src/
    MedicalRecords.tsx ← standalone component (runs without the shell)
```
Explain: "Every module is a self-contained app. A new team copies a package, picks a port, and ships independently."

### UX story: loading strategy taxonomy
```
packages/shell/src/App.tsx
```
Show: Three strategies — `Home` imports `home/Home` directly (instant), `Records` imports `records/MedicalRecords` directly and is eagerly preloaded at shell init, `Prescriptions`/`Analytics` are streamed on demand

### UX story: the streaming pattern (12 lines)
```
packages/prescriptions/src/StreamingPrescriptionOrders.tsx
```
Show: `resource.read()` throws a Promise → Suspense catches it → skeleton displays instantly

### Shell composition (3 layers of resilience + kill switch + load strategy)
```
packages/shell/src/App.tsx
```
Show: `lazy()` + `.catch()` → `<Suspense>` → `<ErrorBoundary>` → kill switch check in `ModuleView`. Also show `loadStrategy` field on `ModuleConfig` and the status strip that shows INSTANT/EAGER/STREAMING per module.

### Event contract
```
packages/records/src/types.ts
```
Show: `WindowEventMap` with typed `addPrescription` and `showNotification` events

### Host-owned navigation request
```
packages/prescriptions/src/PrescriptionOrders.tsx
```
Show: empty-state CTA dispatches `navigateToModule` instead of importing the shell router

### Theme bridge
```
packages/records/src/lib/theme.ts
```
Show: `useActiveTheme()` hook — reads from host bridge, listens for `themeChange`

---

## 9. Run the test suite

```bash
npm test
# 136 tests across 10 files — all green
```

Show the vitest.config.ts alias trick:
```ts
// Resolve MF remote imports to actual source files
"home/Home": path.resolve(
  __dirname, "packages/home/src/Home.tsx"
),
"records/MedicalRecords": path.resolve(
  __dirname, "packages/records/src/MedicalRecords.tsx"
),
```

---

## 10. Fallback: Static screenshots

If wifi/demo gods fail, have screenshots of:
- [ ] Home landing page with architecture cards
- [ ] Full records grid loaded
- [ ] Prescriptions with items
- [ ] Analytics stats
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
| Kill single remote | `npm run kill:records` / `kill:prescriptions` / `kill:analytics` / `kill:home` |
| Start single remote | `cd packages/records && npm run dev` |
