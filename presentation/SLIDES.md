# From 5 Devs to 200: Micro-Frontends That Scale Your Team and Stream Your UI

> A 30-minute conference talk with live demo  
> Built with: React 19 · Rspack · Module Federation · TypeScript 6 · Tailwind CSS v4

---

## Slide 1 — Title

# From 5 Devs to 200

### Micro-Frontends That Scale Your Team and Stream Your UI

```
Shell (host)    :3000
├── Home        :3004
├── Records     :3001
├── Prescriptions :3002
└── Analytics   :3003
```

*"What happens when you stop treating Suspense and Module Federation as separate ideas?"*

---

## Slide 2 — The Problem

### The Real Bottleneck Isn't Your Framework — It's Your Team Size

Most frontend architecture talks start with bundle sizes or code splitting. But the actual pain that drives companies to micro-frontends is **developer experience at scale**.

```
  5 devs → everyone knows the codebase → fast, fun, productive
 15 devs → merge conflicts daily, CI takes 20 min → slowing down
 50 devs → deploys blocked by unrelated failures → frustrating
100 devs → teams waiting on other teams to release → DX is broken
200 devs → nobody understands the full app → onboarding takes months
```

| Monolith Pain (DX) | MF Solution |
|---|---|
| Teams blocked by shared release cycles | Independent deployment per module |
| One broken test blocks everyone's pipeline | Each team owns their own test suite |
| Onboarding means learning the entire app | New devs learn one module, contribute day one |
| Shared `package.json` — upgrade together or not at all | Each remote pins its own dependencies |
| 15-minute CI builds for a one-line change | Each remote builds in seconds |

**But solving DX isn't enough.**  
Visitors don't care about your team structure. They care that the app feels fast.

> **This demo shows both pillars:**  
> Module Federation → excellent **DX** for growing teams  
> Suspense streaming → excellent **UX** for end users

---

## Slide 3 — The Insight

### Two Pillars: DX for Your Team, UX for Your Users

| Pillar | Who Benefits | What It Solves |
|--------|-------------|---------------|
| **Module Federation** | Developers & teams | Independent builds, deploys, onboarding — DX at scale |
| **Suspense + Skeletons** | End users & visitors | Instant perceived load, no blank screens — UX at runtime |

```
Without Suspense:  User clicks a tab → blank screen → spinner → content
                   (terrible UX, even with great DX)

With Suspense:     User clicks a tab → skeleton instantly → content streams in
                   (each remote owns its loading choreography)
```

> **The shell doesn't know or care how long a remote takes to load.**  
> It just renders `<Suspense>` and moves on. The user sees a skeleton immediately.

---

## Slide 4 — Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   SHELL (:3000)                     │
│                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐ │
│  │ Nav     │  │ Theme   │  │ Status Strip         │ │
│  │ Router  │  │ Control │  │ INSTANT | EAGER |    │ │
│  └─────────┘  └─────────┘  │ STREAMING | module   │ │
│                             └─────────────────────┘ │
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
         │          │          │          │
    ┌────┴───┐ ┌────┴───┐ ┌───┴───┐ ┌────┴─────┐
    │  Home  │ │Records │ │Prescr│ │Analytics │
    │ :3004  │ │ :3001  │ │ :3002 │ │  :3003   │
    │INSTANT │ │ EAGER  │ │STREAM │ │ STREAM   │
    └────────┘ └────────┘ └───────┘ └──────────┘
```

**Loading strategy taxonomy — not every module loads the same way:**

| Strategy | Module | Behavior |
|----------|--------|----------|
| **Instant** | Home | Lazy for code splitting, but no streaming delay. Renders the moment the chunk arrives. |
| **Eager** | Records | Imports the standalone component directly, preloaded on shell mount — already cached before the user clicks. No skeleton, no streaming delay. |
| **Streamed** | Prescriptions, Analytics | Loaded on demand with skeleton streaming. |

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
// packages/records/rspack.config.js
new rspack.container.ModuleFederationPlugin({
  name: "records",
  filename: "remoteEntry.js",
  exposes: {
    "./MedicalRecords":          "./src/MedicalRecords.tsx",
    "./StreamingMedicalRecords": "./src/StreamingMedicalRecords.tsx",
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
    home:      "home@http://localhost:3004/remoteEntry.js",
    records:  "records@http://localhost:3001/remoteEntry.js",
    prescriptions:      "prescriptions@http://localhost:3002/remoteEntry.js",
    analytics: "analytics@http://localhost:3003/remoteEntry.js",
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
// StreamingMedicalRecords.tsx

import MedicalRecords from "./MedicalRecords";

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

const StreamingMedicalRecords = () => {
  const resource = getResource("records-initial", 2500);
  resource.read();  // Throws promise → triggers <Suspense> in the shell
  return <MedicalRecords />;
};
```

> The streaming wrapper's ONLY job is to trigger Suspense.  
> The actual UI lives in the standalone component.

---

## Slide 8 — Shell Composition + Loading Strategies

### Not every module should load the same way

```tsx
// Shell App.tsx — three loading strategies in one file

// INSTANT — Home renders the moment the chunk arrives (no streaming delay)
const Home = lazy(() =>
  import("home/Home").catch(() => ({
    default: () => <ModuleFallback title="Home Unavailable" />,
  }))
);

// EAGER — Records imports standalone component, preloaded on shell mount
const MedicalRecords = lazy(() =>
  import("records/MedicalRecords").catch(() => ({
    default: () => <ModuleFallback title="Records Unavailable" />,
  }))
);

// STREAMED — Prescriptions and Analytics load on demand with skeleton fallbacks
const StreamingPrescriptionOrders = lazy(() =>
  import("prescriptions/StreamingPrescriptionOrders").catch(() => ({
    default: () => <ModuleFallback title="Prescriptions Unavailable" />,
  }))
);

// Eagerly preload "eager" modules at shell init
const EAGER_MODULES = MODULES.filter((m) => m.loadStrategy === "eager");
for (const m of EAGER_MODULES) { PREFETCHERS[m.id](); }
```

**Three layers of resilience** (applied to every strategy):
1. `lazy()` + `.catch()` → fallback if remote is unreachable
2. `<Suspense>` → skeleton while loading
3. `<ErrorBoundary>` → catches runtime errors in the remote

**Why `lazy()` even for eager modules?** You can't use a static `import` with Module Federation — the remote is a separate build on a separate server, resolved at runtime. `lazy()` + a pre-warmed `import()` cache is the standard pattern: the `import()` fires at shell init, the browser caches the resolved module, and when React later calls the same `import()` inside `lazy()`, it resolves instantly from cache. You get both code splitting *and* instant rendering.

**Why different strategies?** Home is your landing page — users expect it instantly. Records is high-value content — preload it so it's ready when they click. Prescriptions and Analytics are secondary — stream them on demand.

---

## Slide 9 — Fault Isolation

### DEMO: Kill a remote with the Federation Lab

```bash
# Open the Federation Lab panel (click "Lab" button or Ctrl+K → "Open Federation Lab")
# Toggle the records kill switch — the shell renders ModuleFallback
# Prescriptions and Analytics are unaffected
# Or: stop the actual records dev server for a real fault demo
```

```tsx
// lazy() with .catch() — the secret sauce
const MedicalRecords = lazy(() =>
  import("records/MedicalRecords").catch(() => ({
    default: () => (
      <ModuleFallback
        title="Records Module Unavailable"
        message="The records service is currently unavailable."
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
Records                 Shell               Prescriptions
   │                      │                   │
   ├─ addPrescription ───────────────────────────►│                   │
  ├─ navigateToModule ───►│                   │
   │                      ├─ showNotification─►│ (toast)
   │                      │                   ├── updates prescription state
   │                      │                   │
```

```tsx
// Records dispatches
window.dispatchEvent(new CustomEvent("addPrescription", {
  detail: { id: 1, name: "Sarah Chen prescription", price: 2499.99, quantity: 1 },
}));

// Prescriptions listens
useEffect(() => {
  const handler = (e: CustomEvent) => {
    setPrescriptionItems(prev => [...prev, e.detail]);
  };
  window.addEventListener("addPrescription", handler);
  return () => window.removeEventListener("addPrescription", handler);
}, []);

// Prescriptions can also request host-owned navigation
window.dispatchEvent(new CustomEvent("navigateToModule", {
  detail: { module: "records" },
}));
```

**Why CustomEvents?**
- Zero coupling — modules don't import each other
- The shell stays the only router owner
- Survives independent deployments and version mismatches
- Works across any framework (React, Vue, Svelte)
- Easy to type with TypeScript's `WindowEventMap`

---

## Slide 11 — Typed Event Contracts

### TypeScript makes events safe

```tsx
// types.ts — shared across all remotes

interface AddPrescriptionEvent extends CustomEvent {
  detail: {
    readonly id: number;
    readonly name: string;
    readonly price: number;
    readonly quantity: number;
  };
}

declare global {
  interface WindowEventMap {
    addPrescription: AddPrescriptionEvent;
    navigateToModule: CustomEvent<{ module: "home" | "records" | "prescriptions" | "analytics" }>;
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
        ├── Records      → useActiveTheme() hook
        ├── Prescriptions → useActiveTheme() hook
        └── Analytics    → useActiveTheme() hook
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

**Three themes:** Dark (editorial noir) · Light (clean white)

---

## Slide 13 — Prefetching + Eager Loading

### Two layers: eager on mount, hover on demand

```tsx
const PREFETCHERS: Record<ModuleType, () => Promise<unknown>> = {
  home:      () => import("home/Home").catch(() => undefined),
  records:       () => import("records/MedicalRecords").catch(() => undefined),
  prescriptions: () => import("prescriptions/StreamingPrescriptionOrders").catch(() => undefined),
  analytics:     () => import("analytics/StreamingClinicalAnalytics").catch(() => undefined),
};

// EAGER — preload on shell mount (fires at module evaluation time)
const EAGER_MODULES = MODULES.filter((m) => m.loadStrategy === "eager");
for (const m of EAGER_MODULES) { PREFETCHERS[m.id](); }

// HOVER — prefetch remaining modules on tab hover
<NavLink onMouseEnter={() => PREFETCHERS[module.id]()} />
```

| Strategy | When it loads | Example |
|----------|--------------|----------|
| **Instant** | Chunk fetched lazily, no streaming delay | Home |
| **Eager** | Preloaded the moment the shell mounts, no streaming delay | Records |
| **Hover** | Prefetched when user hovers a tab | Prescriptions, Analytics |

> Records is already cached by the time the user clicks.  
> Prescriptions and Analytics start loading when the cursor touches the tab.

**Audience Q: "Why `lazy()` for eager modules?"** — Module Federation remotes are separate builds on separate servers, resolved at runtime via `import()`. You can't use a static `import`. The eager pattern fires `import()` at shell init so the chunk is cached; `lazy()` later resolves from that cache instantly. This is confirmed by the test: *"renders records immediately without a skeleton (eager strategy)"*.

---

## Slide 14 — Testing Strategy

### How to test federated components in isolation

```ts
// vitest.config.ts — resolve MF imports to source files
resolve: {
  alias: {
    "home/Home": path.resolve(
      __dirname, "packages/home/src/Home.tsx"
    ),
    "records/MedicalRecords": path.resolve(
      __dirname, "packages/records/src/MedicalRecords.tsx"
    ),
    "prescriptions/StreamingPrescriptionOrders": path.resolve(
      __dirname, "packages/prescriptions/src/StreamingPrescriptionOrders.tsx"
    ),
    "analytics/StreamingClinicalAnalytics": path.resolve(
      __dirname, "packages/analytics/src/StreamingClinicalAnalytics.tsx"
    ),
    // ...
  },
}
```

```tsx
// MedicalRecords.test.tsx
it("dispatches addPrescription event on Add click", async () => {
  const handler = vi.fn();
  window.addEventListener("addPrescription", handler);

  render(<MedicalRecords />);
  await user.click(screen.getByRole("button", { name: /create prescription for Sarah Chen/i }));

  expect(handler).toHaveBeenCalledTimes(1);
  expect(handler.mock.calls[0][0].detail).toEqual({
    id: 1, name: "Sarah Chen prescription", price: 2499.99, quantity: 1,
  });
});
```

**136 tests across 10 files — all passing.**

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

| Dark | Light |
|---|---|
| `#0C0C0C` noir | `#FFFFFF` clean white |
| High contrast | Crisp readability |

---

## Slide 16 — Live Demo Script

### 1. Full federation + DX story (2 min)
- Open `localhost:3000` — Home landing page loads **instantly** (no skeleton, no delay — it's the "instant" strategy)
- Point out: "Home loads the moment the chunk arrives — no streaming delay. Watch the status strip: it says INSTANT."
- Click **Records** — it loads fast because it was **eagerly preloaded** on shell mount. Status strip shows EAGER.
- Click **Prescriptions** — observe the skeleton streaming in. Status strip shows STREAMING. "This is the streamed strategy — loaded on demand."
- Explain: "Three loading strategies for three content priorities. The shell decides *how* each module loads based on its importance."
- Navigate to Records, add a prescription — toast notification + prescriptions sync
- Empty the prescriptions list — use the CTA to prove a remote can request host navigation without importing the router

### 2. Federation Lab — fault isolation (2 min)
- Click **Lab** button in the header (or Ctrl+K → "Open Federation Lab")
- Show the **Remote Health Monitor** — all 4 remotes showing green with latency
- Toggle the **Kill Switch** for records — records shows `ModuleFallback`, other modules keep running
- Navigate between prescriptions and analytics to prove they're unaffected
- Restore records from the Lab panel
- Optionally kill the real records server (`Ctrl+C`) and show the health monitor detect it going offline

### 3. A/B deployment (1 min)
- In the Federation Lab, toggle from **Stable** to **Canary** ring
- Show version info changing per module (e.g., records 2.1.0 → 2.2.0-canary.1)
- Note the status bar showing "CANARY" indicator
- Explain: "In production, each remote could be deployed at a different version independently"

### 4. Theme switching (30 sec)
- Toggle Dark → Light in the shell header
- Watch CSS variables update across all remotes
- Show localStorage persistence — refresh and theme persists

### 5. Code walkthrough (3 min)
- `StreamingPrescriptionOrders.tsx` — resource pattern (12 lines)
- `App.tsx` — lazy + catch + Suspense + ErrorBoundary + kill switch check
- Cross-module `addPrescription` event flow
- `lib/health.ts` — useRemoteHealth hook (HEAD requests to remoteEntry.js)

### 6. Testing (1 min)
- Run `npm test` — 136 tests, all green
- Show vitest.config.ts alias trick for MF imports

---

## Slide 17 — Key Takeaways

### 1. Micro-frontends solve a people problem, not just a code problem
The #1 reason to adopt this architecture: your team is growing and your monolith can't keep up. Independent modules = independent teams = DX that scales to hundreds of developers.

### 2. Suspense streaming solves the UX side
DX and UX are two separate pillars. Module Federation gives your team independence. Suspense + skeletons give your users instant perceived load. This demo shows both working together.

### 3. Events > Shared state
`CustomEvent` on `window` gives you decoupled communication that survives independent deploys.

### 4. Host owns routing
Remotes can ask for navigation with `navigateToModule`, but only the shell mutates router state.

### 5. Fault isolation is a feature, not a side effect
`.catch()` on lazy imports + `ErrorBoundary` per module = one broken remote never kills the app.

### 6. Rspack makes this fast
Sub-second HMR in a monorepo with 4 applications. Module Federation is a first-class citizen.

### 7. Not every module should load the same way
```tsx
// Three strategies in one shell:
{ id: "home",      loadStrategy: "instant"  }  // No streaming delay
{ id: "records",        loadStrategy: "eager"    }  // Preloaded on shell mount
{ id: "prescriptions",  loadStrategy: "streamed" }  // On demand with skeletons
```
The landing page is instant. High-priority content is eager. Secondary content streams on demand. The shell decides based on content importance.

---

## Slide 18 — When to Apply This

### You're ready for this architecture when…

| Signal | Pattern to Adopt |
|---|---|
| Multiple teams ship the same SPA and block each other on releases | **Module Federation** — independent builds, independent deploys |
| Your app has distinct domains (records, prescriptions, analytics, admin) | **Federated remotes** — one per domain, each owns its own data |
| Users wait for a full bundle before they see anything | **Suspense streaming** — skeletons render instantly, content streams in |
| One broken feature takes down the whole page | **ErrorBoundary + lazy().catch()** — fault isolation per module |
| Shared state libraries create invisible coupling between features | **CustomEvents on window** — zero-import communication |
| You need A/B testing or canary releases at the feature level | **Independent versioning** — deploy one remote without touching others |
| Designers struggle to keep UI consistent across team-owned features | **CSS variable theming** — shell owns tokens, remotes inherit |
| Your test suite requires the full app running to test one feature | **Vitest alias trick** — test any remote in isolation, no servers |

### Where this runs in production today

- **Healthcare platforms** — patient records, prescriptions, analytics, scheduling each as federated remotes
- **SaaS dashboards** — billing, analytics, settings, admin panels from different teams
- **Enterprise portals** — HR, IT, finance modules stitched into one shell
- **Media platforms** — content feeds, player, recommendations, user profiles
- **Internal tools** — each ops team owns their module, shared shell provides auth and nav

> **Start small.** Extract one slow-moving feature into a remote. Keep the rest in the shell. Prove the pattern. Then expand.

---

## Slide 19 — What We Didn't Cover (But You Should Explore)

- **Server-side rendering** with streaming Suspense + Module Federation
- **Shared design tokens** via a federated CSS module
- **Version negotiation** when remotes have different React versions
- **Deployment pipelines** — independent CI/CD per remote
- **Dynamic remote URLs** — loading remotes from a manifest at runtime
- **Real health checks** — replacing the demo's HEAD-request polling with production-grade liveness probes
- **Feature flags** — extending the A/B ring concept with runtime feature toggles per module
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
npm install && npm run ports:check && npm run dev
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
- **25:00–27:00** — When to apply this (slide 18)
- **27:00–28:00** — Key takeaways (slide 17)
- **28:00–30:00** — Questions

### Demo Prep Checklist
- [ ] `npm run ports:check` passes
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
