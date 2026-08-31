# AGENTS.md — `shell` (the host)

Extends the root [`../../AGENTS.md`](../../AGENTS.md). Rules here win inside
`packages/shell/`.

**Role:** the only **host** in the federation. Port **3000**. Federation name `shell`.
It exposes nothing and consumes all four remotes.

---

## What the shell owns, and what it must not own

The shell is a **composition layer**. It owns:

- Routing (`react-router-dom` v6 — note: v6 here, the root `package.json` has v7 for
  tests; the shell's own dependency is the one that ships)
- The module registry, navigation, and layout chrome
- Theme definition and broadcast (`src/lib/theme.ts`)
- Per-module `<Suspense>` and `<ErrorBoundary>` boundaries
- The single `<Toaster />` for the whole app
- Remote health polling and the demo control surfaces
- Its own client store and `QueryClient` (`src/lib/counter-store.ts`,
  `src/components/SharedStateBar.tsx`)

It must **not** own business UI. Patient records, prescription tables, and charts belong
to their remotes. If you are about to write domain UI in the shell, you are working in
the wrong package.

### The shell's state is the shell's — not a hub

The shell has a store and a `QueryClient` like every other package. Two rules keep that
from quietly turning into central ownership:

1. **The shell is a peer on the event bus, not a broker.** Its counter store broadcasts and
   listens exactly like a remote's. It does not relay, aggregate, or arbitrate other
   modules' state. If you find yourself writing "the shell keeps track of X for the
   remotes", stop — that is a hub, and the remotes stop being independently deployable.

2. **The shell fetches only what it owns.** `SharedStateBar` queries `/users/1` — the
   signed-in user, which is chrome. It must **not** fetch `/todos`: that is a remote's
   domain data, and a host reaching for it is the boundary violation everything else here
   avoids. Legitimate host server state is session, permissions, unread counts, feature
   flags. Anything a remote owns, the remote fetches.

Neither zustand nor `@tanstack/react-query` is in this package's `shared` block, and
neither should be. See the root `AGENTS.md`.

---

## The module registry — the one place to add a module

`src/App.tsx` holds a `MODULES` array typed `readonly ModuleConfig[]`. Every entry needs
`id`, `label`, `path`, `port`, `component`, `loadStrategy`. Everything else — nav links,
routes, the command palette, health checks, prefetching, the benchmark table — derives
from that array. **Add a module by adding one entry, not by touching six call sites.**

### Three loading strategies, deliberately different

| Strategy | Module | What the shell imports | Why |
|---|---|---|---|
| `instant` | Home | `home/Home` | Lazy for code splitting, no artificial delay. Real content the moment the chunk lands. |
| `eager` | Records | `records/MedicalRecords` | Prefetched on shell mount, so the chunk is cached before the user clicks. |
| `streamed` | Prescriptions, Analytics | `prescriptions/StreamingPrescriptionOrders`, `analytics/StreamingClinicalAnalytics` | Loaded on demand behind a purpose-built skeleton. |

The `Streaming*` variants suspend on purpose (a cached Resource with a timer). The plain
variants do not. **Pick the specifier that matches the strategy** — importing
`records/StreamingMedicalRecords` under an `eager` strategy defeats the prefetch.

### Every remote import goes through `loadRemote()`

```ts
const MedicalRecords = lazy(() =>
  loadRemote(() => import("records/MedicalRecords"), "MedicalRecords",
             "Records Module Unavailable", "The records service is currently unavailable.")
);
```

`loadRemote()` attaches a `.catch()` that resolves to `<ModuleFallback />` instead of
rejecting. This is the fault-isolation guarantee: if a remote's `remoteEntry.js` is
unreachable, the host degrades to a fallback card and every other module keeps working.
**Never `lazy(() => import("remote/Thing"))` directly** — an uncaught rejection takes out
the whole route.

### `PREFETCHERS` must use the same specifier as `lazy()`

Every module's remote specifier is written **twice**: once in the `lazy(loadRemote(...))`
call, once in the `PREFETCHERS` map. They must match character-for-character.

`Record<ModuleType, ...>` makes a *missing* entry a compile error, so adding a module is
safe. **Drift is not caught by anything.** Repoint `lazy()` at
`records/StreamingMedicalRecords` and leave `PREFETCHERS` on `records/MedicalRecords` and
both still compile — while the prefetch warms a chunk nobody renders, and the `eager` and
hover-prefetch strategies silently stop working. If eager "stops feeling instant", check
this pair first.

Keep `.catch(() => undefined)` on every prefetcher. Nothing awaits these promises, so
without it an unreachable remote throws an unhandled rejection into the console. The real
error handling is `loadRemote()`'s catch on the render path.

`PREFETCHERS` is called from three places, and all three are load-bearing:

1. **Module-eval time**, filtered to `loadStrategy === "eager"` — this is what makes eager
   actually eager.
2. **`onMouseEnter`** on a nav link, gated by
   `shouldPrefetchOnHover = module.id !== "prescriptions"`. Prescriptions is excluded on
   purpose so `BENCHMARK_TARGETS` has a true no-prefetch control. Do not "fix" that.
3. **A `useEffect` on `activeModule` change.** This looks redundant with `lazy()` and
   mostly is — except when the module is killed. `ModuleView` returns `<ModuleFallback />`
   early when `isKilled`, so `<Component />` never mounts and `lazy()` never imports. This
   effect is then the only thing warming that chunk, which is why restoring a killed remote
   renders immediately instead of showing a skeleton. **Removing it would silently change
   the kill-switch demo.**

---

## Federated imports need ambient types

TypeScript cannot resolve `records/MedicalRecords`; it only exists at runtime. Every
federated specifier is declared in `src/types.d.ts`:

```ts
declare module "records/MedicalRecords" {
  const MedicalRecords: import("react").ComponentType;
  export default MedicalRecords;
}
```

`types.d.ts` also declares the `window` augmentations: `Window.__MF_THEME__` and the
`WindowEventMap` entries for every cross-module event. **Adding a remote import or a new
cross-module event without updating `types.d.ts` will fail `pnpm typecheck`.**

---

## Theme is host-owned and pushed to remotes

`src/lib/theme.ts` defines `THEME_DEFINITIONS`, persists to `localStorage` under
`mf-demo-theme`, and applies the theme to the document. The shell publishes
`window.__MF_THEME__ = { getTheme, setTheme }` and dispatches a `themeChange` CustomEvent
on every change.

Remotes read the theme through that bridge and never set it. If you add a theme, add it
to `THEME_DEFINITIONS` and confirm the CSS custom properties exist in **each** remote's
`src/index.css` — remotes carry their own copy of the tokens.

---

## Demo instrumentation

Two host-only libraries back the demo control surfaces. Both are mock data by design.

- **`src/lib/health.ts`** — `useRemoteHealth()` polls each remote's `remoteEntry.js` every
  5s with a `HEAD` + `mode: "no-cors"` fetch. Opaque responses (`type === "opaque"`,
  status 0) count as **online**; that is expected, not a bug. It targets
  `http://localhost:<port>` and so only reports meaningfully in local dev.
- **`src/lib/demo.ts`** — `useKillSwitch()` simulates a remote going down;
  `useVersionRegistry()` serves a hardcoded stable/canary version table. If you add a
  module, add it to `MOCK_VERSIONS` **and** `CANARY_VERSIONS` — `useVersionRegistry`
  indexes with a non-null assertion and will throw on a missing id.

---

## Skeletons are per module, not generic

`HomeSkeleton`, `RecordsSkeleton`, `PrescriptionsSkeleton`, `AnalyticsSkeleton` each
mirror the real layout of their module. That is what makes the loading state feel
instant rather than blank. A new streamed module gets its own skeleton — do not reach for
`LoadingSpinner` as the Suspense fallback for a full route view.

---

## `rspack.config.ts` specifics for the host

Things that differ from the remotes:

- **`remotes`, not `exposes`.** Built by the `remoteUrl(name, devPort)` helper, which
  switches between `${REMOTE_BASE_URL}/remotes/<name>/remoteEntry.js` (CI/Pages) and
  `http://localhost:<devPort>/remoteEntry.js` (local). Keep both branches working.
- **`filename: "remoteEntry.js"` is still set** even though the shell exposes nothing —
  harmless, and it keeps the host ready to become a remote later.
- **`publicPath`** honours `BASE_PATH` so the app can be served from a subdirectory on
  GitHub Pages. Remotes use plain `"auto"`.
- **`optimization.splitChunks`** is configured here only — a `react` cache group, a
  `vendor` group, and `maxSize: 244000`. The remotes deliberately leave splitting alone,
  because the host already owns shared React.
- **`resolve.alias`** provides `@`, `@components`, `@lib`. Present in shell, home, and
  records; `prescriptions` and `analytics` have no aliases. Use relative imports in those
  two.
- **`performance.maxAssetSize` is 512000** here, twice the remotes' budget, because the
  host carries React and the router.
- **`devServer.client.progress: true`** is host-only.

---

## Before you finish

```bash
cd ../.. && pnpm typecheck && pnpm test && pnpm build
```

Then, if you touched loading, routing, or remote wiring, start all five servers
(`pnpm dev`) and check that every route renders and no remote falls back to
`<ModuleFallback />`.

---

## Skills in this package

- `.agents/skills/wire-new-remote/` — add a new remote to the host end to end
- `.agents/skills/debug-federation-runtime/` — a remote will not load; diagnose it
