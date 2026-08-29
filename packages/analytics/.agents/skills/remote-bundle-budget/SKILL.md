---
name: remote-bundle-budget
description: Keep a federated remote inside its size budget when adding a dependency or investigating a Rspack performance warning. Use before adding a charting, date, or utility library to a remote, or when a build warns about maxAssetSize / maxEntrypointSize.
---

# Remote Bundle Budget

In a federated app, **each remote pays for its own dependencies at runtime**, downloaded
when the user first navigates to that module. A dependency added here is not amortized
across the app the way it would be in a single-bundle SPA.

This skill lives in `analytics` because it is a `streamed` module — nothing is prefetched,
so its download size is directly visible as latency.

## The budgets

```ts
performance: {
  hints: isDev ? false : "warning",
  maxAssetSize: 256000,        // 256 KB per emitted asset
  maxEntrypointSize: 256000,   // 256 KB for the entry
}
```

- Remotes: **256000** (`home`, `records`, `prescriptions`, `analytics`)
- Shell: **512000** — double, because the host carries shared React and the router

`hints: "warning"` means Rspack prints a warning and the build still succeeds. **Treat
the warning as a failure.** Nothing else in this repo enforces it.

## Before adding a dependency

Answer these four questions first.

### 1. Can the existing code do it?

`analytics` today is dependency-free: stat cards, trend arrows, and the activity feed are
plain markup driven by `MOCK_STATS` and `MOCK_ACTIVITIES`, styled with Tailwind v4
tokens. Sparklines, bars, and gauges are achievable with CSS and inline SVG at zero
bundle cost. A charting library for four stat cards is not a good trade.

### 2. Will it be duplicated across remotes?

This is the federation-specific trap. If `analytics` and `records` both add the same
library and neither declares it in `shared`, **the user downloads it twice.**

To share it, add it to `shared` in **every** config that uses it:

```ts
shared: {
  react:       { singleton: true, strictVersion: false, requiredVersion: "^19.2.7", eager: false },
  "some-lib":  { singleton: false, requiredVersion: "^3.0.0", eager: false },
}
```

Guidance:
- **`singleton: true`** only for libraries that break with two instances — anything
  holding module-level state or React context. React is the canonical case.
- **`singleton: false`** for stateless utilities. Version negotiation still dedupes when
  ranges overlap, without the hard failure mode.
- **Never `eager: true`** — it defeats the async boundary that this repo depends on. See
  the root `AGENTS.md` hard rules.
- Sharing a library used by only **one** remote adds negotiation overhead for no benefit.
  Do not share it.

### 3. Is there a lighter option?

Check the install cost before committing, not after:

```bash
npm view <package> dist.unpackedSize
```

Prefer libraries that are ESM-only and tree-shakeable. A CommonJS library with a
side-effectful index will pull in far more than the import suggests.

### 4. Does it need to be in the remote at all?

Formatting, theming, and layout concerns often belong in the host, which already carries
shared infrastructure and has twice the budget.

## Measuring what you actually shipped

```bash
cd packages/analytics && pnpm run build
```

Read the emitted asset table and any `performance` warnings. Compare against the previous
build — the delta is what your change cost.

For a real breakdown of *why* a bundle grew, use the repo-wide Rsdoctor skill at
`.agents/skills/rsdoctor-analysis/`, which analyses `rsdoctor-data.json` and gives
evidence-based recommendations rather than guesses. It needs
`@rsdoctor/rspack-plugin` >= 1.5.9 wired into the config; add it temporarily for the
investigation and remove it before committing.

## Splitting, if you genuinely need the weight

Note what this package does **not** have:

- **`optimization.splitChunks` is not configured here.** Only the shell splits chunks
  (`react`, `vendor`, `maxSize: 244000`). A heavy dependency added to this remote lands
  in one chunk.
- **`resolve.alias` is not configured here either** — no `@`, `@components`, `@lib`. Use
  relative imports.

If a heavy feature is genuinely required, load it lazily *inside* the remote rather than
enlarging the entry:

```tsx
const HeavyChart = lazy(() => import("./HeavyChart"));
```

That keeps the module's first paint fast and defers the weight to the moment it is
needed. The remote already renders behind the shell's `<Suspense>`, so nesting another
boundary is cheap.

Before reaching for `splitChunks` here, consider whether the shell should own the
dependency instead — it is already the shared layer.

## Checklist before adding a dependency to a remote

- [ ] The existing dependency-free approach genuinely will not work
- [ ] Checked whether another remote already uses it (duplication risk)
- [ ] If shared: added to `shared` in **every** consuming config, `eager: false`
- [ ] `singleton` chosen deliberately, not copied from the React entries
- [ ] Measured `pnpm run build` output before and after
- [ ] No `performance` warning in the production build
- [ ] Heavy, rarely used features are lazily imported inside the remote
