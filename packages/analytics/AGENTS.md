# AGENTS.md — `analytics` (remote)

Extends the root [`../../AGENTS.md`](../../AGENTS.md). Rules here win inside
`packages/analytics/`.

**Role:** remote. Port **3003**. Federation name `analytics`. Route `/analytics` in the
shell. Domain: clinical metrics, stat cards, and the activity feed.

---

## Federation contract

```ts
exposes: {
  "./ClinicalAnalytics":          "./src/ClinicalAnalytics.tsx",
  "./StreamingClinicalAnalytics": "./src/StreamingClinicalAnalytics.tsx",
}
```

The shell imports **`analytics/StreamingClinicalAnalytics`** — the suspending variant,
behind `<AnalyticsSkeleton />`. Both keys are public API; changing them requires matching
edits in `packages/shell/src/types.d.ts` and the root `vitest.config.ts` alias map.

---

## `analytics` is a `streamed` module, and the most likely one to get fat

Nothing here is prefetched. The chunk downloads when the user clicks, so **download size
is directly user-visible latency** in this module in a way it is not for `records`
(prefetched) or `home` (instant).

This is also the module most likely to acquire a charting library. Before you add one:

- `performance.maxAssetSize` and `maxEntrypointSize` are **256000** here. Rspack will
  warn on production builds that exceed it. **Treat the warning as a failure**, not
  noise.
- `optimization.splitChunks` is **not configured** in this package — only the shell
  splits chunks. A heavy dependency added here lands in one chunk.
- A charting library added to this remote is **not** shared with the federation unless
  you add it to `shared` in this config. If two remotes both add the same charting
  library and neither shares it, users download it twice.

The current implementation is intentionally dependency-free: stat cards, trend arrows,
and the activity feed are plain markup driven by `MOCK_STATS` and `MOCK_ACTIVITIES`.
Prefer extending that over reaching for a dependency.

See `.agents/skills/remote-bundle-budget/` before adding anything to `dependencies`.

---

## Read-only by design

Analytics is the only module that neither dispatches nor listens for domain events. It
reads the theme through `useActiveTheme()` and renders. That is the entire external
surface.

Keep it that way unless there is a real reason not to. A read-only module is trivially
safe to deploy independently — there is no contract for it to break.

If you do add an event, declare its payload in `packages/shell/src/types.d.ts` under
`WindowEventMap` first, and follow the rules in
`packages/prescriptions/.agents/skills/cross-module-events/`.

---

## Streaming wrapper

`StreamingClinicalAnalytics.tsx` follows the same Resource + Suspense pattern as the
other remotes: a module-level `Map` caches the resource so re-renders do not restart the
delay, and `__resetAnalyticsStreamingResourceCache()` exists **only** so tests can clear
it in `beforeEach`. Without that reset, the second test in a file will not suspend.

The reference implementation and its rationale are documented in
`packages/records/.agents/skills/streaming-suspense-remote/`.

---

## Standalone mode

```bash
pnpm dev   # http://localhost:3003
```

`src/index.tsx` is `import("./bootstrap")` and nothing else — the required async
boundary. `ClinicalAnalytics.tsx` imports `./index.css` itself, because the host never
runs `bootstrap.tsx`.

Standalone, `window.__MF_THEME__` is undefined and `useActiveTheme()` falls back to
`localStorage` then `"dark"`.

---

## Local conventions

- **4-space indentation** in `src/*.tsx` (this package and `prescriptions` differ from
  `home`, `records`, and `shell`, which use 2). The `rspack.config.ts` uses 2 like every
  other config. Match the file you are in.
- **No `resolve.alias` in this package.** There is no `@`, `@components`, or `@lib`. Use
  relative imports (`./lib/theme`, `./types`).
- Presentation constants are lookup tables keyed by a union type — `TREND_STYLES`,
  `ACTIVITY_TYPE_LABELS`. Extend the union in `src/types.ts` and the table together, so
  the compiler catches a missing case.
- `isPositive` is metric-aware: for `Critical Alerts`, a **down** trend is good. Any new
  stat where "down is good" needs the same treatment — do not colour trends by direction
  alone.
- Design tokens from `src/index.css`: `cream`, `citrine`, `stone`, `dim`, `edge`,
  `surface`, `elevated`, `mint`, `rose`. `font-mono` for figures, `font-display` italic
  for headings.
- Numbers are mock data. Do not add live polling or a data-fetching layer to this demo
  module without being asked.

---

## Verify

```bash
cd ../.. && pnpm typecheck && pnpm test && pnpm build
```

Watch the build output for Rspack performance warnings — they are the budget check for
this package. Then load `/analytics` in the shell and confirm the skeleton resolves to
the real view exactly once.

---

## Skills in this package

- `.agents/skills/remote-bundle-budget/` — keep this remote inside its size budget
