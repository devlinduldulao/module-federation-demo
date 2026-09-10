---
name: wire-new-remote
description: Add a new remote micro-frontend to the shell host, end to end. Use when asked to add a module, register a remote, wire up a new micro-frontend, or make the shell consume a new federated component.
---

# Wire a New Remote into the Shell

Adding a remote touches **seven** places. Missing any one produces a runtime failure that
the build will not catch. Work through them in order.

Assume the new remote is named `billing`, exposes `./BillingOverview` and
`./StreamingBillingOverview`, and runs on port `3005`.

## 1. Pick a port and claim it

Ports in use: 3000 shell, 3001 records, 3002 prescriptions, 3003 analytics, 3004 home.
Take the next free one and add it to the root `package.json`:

- `dev:billing` and `build:billing` and `typecheck:billing` scripts (follow the existing
  pattern exactly — `cd packages/billing && pnpm run <x>`)
- `install:packages` — append `pnpm --dir packages/billing install --force`
- `kill:ports` — add the port to the `kill-port` list, and add a `kill:billing` script

## 2. Register the remote in `rspack.config.ts`

In `packages/shell/rspack.config.ts`, add one line to `ModuleFederationPlugin.remotes`:

```ts
remotes: {
  home:          remoteUrl("home", 3004),
  records:       remoteUrl("records", 3001),
  prescriptions: remoteUrl("prescriptions", 3002),
  analytics:     remoteUrl("analytics", 3003),
  billing:       remoteUrl("billing", 3005),   // ← new
}
```

Use the `remoteUrl()` helper. Do **not** hardcode a URL — the helper is what makes the
GitHub Pages deployment work, by switching to
`${REMOTE_BASE_URL}/remotes/<name>/remoteEntry.js` when that env var is set.

The key (`billing`) becomes the import prefix and **must equal** the remote's federation
`name` in its own config, which must equal its `output.uniqueName`.

## 3. Declare the ambient types

TypeScript cannot resolve `billing/BillingOverview` — it only exists at runtime. Add to
`packages/shell/src/types.d.ts`:

```ts
declare module "billing/BillingOverview" {
  const BillingOverview: import("react").ComponentType;
  export default BillingOverview;
}

declare module "billing/StreamingBillingOverview" {
  const StreamingBillingOverview: import("react").ComponentType;
  export function __resetBillingStreamingResourceCache(): void;
  export default StreamingBillingOverview;
}
```

Also extend the `ModuleType` union in `src/App.tsx` and the `moduleChange` /
`navigateToModule` payload unions in `types.d.ts` — they enumerate module ids literally.

## 4. Add the lazy import — always through `loadRemote()`

```ts
const StreamingBillingOverview = lazy(() =>
  loadRemote(
    () => import("billing/StreamingBillingOverview"),
    "StreamingBillingOverview",
    "Billing Module Unavailable",
    "The billing service is currently unavailable."
  )
);
```

**Never** write `lazy(() => import("billing/..."))` directly. `loadRemote()` attaches the
`.catch()` that degrades to `<ModuleFallback />` instead of taking down the route. That
catch is the fault-isolation guarantee this whole architecture is built on.

Choose the specifier by strategy:

| Strategy | Import | Use when |
|---|---|---|
| `instant` | the plain component | It is a landing view; must render as soon as the chunk lands |
| `eager` | the plain component | Frequently visited; worth prefetching on shell mount |
| `streamed` | the `Streaming*` wrapper | Loaded on demand behind a skeleton |

### Add the matching `PREFETCHERS` entry — same specifier

```ts
const PREFETCHERS: Record<ModuleType, () => Promise<unknown>> = {
  // ...
  billing: () => import("billing/StreamingBillingOverview").catch(() => undefined),
};
```

**The specifier here must be character-for-character the one in `lazy()` above.** It is
written twice per module and nothing enforces the pair:

- A *missing* entry is caught — `Record<ModuleType, …>` is exhaustive, so it will not compile.
- **Drift is not caught.** Point `lazy()` at `billing/StreamingBillingOverview` and leave
  `PREFETCHERS` on `billing/BillingOverview` and both compile fine, while the prefetch warms
  a chunk nobody asks for. Eager and hover-prefetch silently stop working, with no error.

Keep the `.catch(() => undefined)`. Nobody awaits these promises, so without it an
unreachable remote produces an unhandled promise rejection. Real error handling belongs in
`loadRemote()` on the render path.

## 5. Add one entry to `MODULES`

```ts
{
  id: "billing",
  label: "Billing",
  path: "/billing",
  port: "3005",
  component: StreamingBillingOverview,
  loadStrategy: "streamed",
},
```

Nav links, routes, the command palette, health polling, prefetching, and the benchmark
table are all derived from `MODULES`. **Do not add the module to those call sites
individually** — if something does not appear, the derivation is what needs fixing.

## 6. Build a skeleton that matches

Create `packages/shell/src/components/BillingSkeleton.tsx` mirroring the real layout, and
pass it as the `<Suspense fallback>`. Do not use `LoadingSpinner` for a full route view —
a generic spinner is what makes a streamed module feel slow.

## 7. Wire the test alias

Root `rstest.config.ts`, in `resolve.alias`:

```ts
"billing/StreamingBillingOverview": path.resolve(import.meta.dirname, "packages/billing/src/StreamingBillingOverview.tsx"),
"billing/BillingOverview":          path.resolve(import.meta.dirname, "packages/billing/src/BillingOverview.tsx"),
```

Without this, any test that touches the shell's `App.tsx` fails to resolve the import.

## 9. CI

Copy `.github/workflows/ci-analytics.yml` to `ci-billing.yml`, changing the path filter
and package name. Add `billing` to the remote loops in `.github/workflows/deploy.yml`
(both the "Build remotes" step and the "Assemble site" step).

## Verify

Run the `verify-federation` skill from the repo root. At minimum:

```bash
pnpm typecheck && pnpm test && pnpm build
pnpm dev
```

Then confirm in the browser that `/billing` renders, no `<ModuleFallback />` appears, and
the console is free of `Invalid hook call` and `Loading script failed`.

## Checklist

- [ ] Port claimed; root `package.json` scripts added
- [ ] `remotes` entry added via `remoteUrl()`
- [ ] `types.d.ts` ambient modules + `ModuleType` union extended
- [ ] Lazy import wrapped in `loadRemote()`
- [ ] `PREFETCHERS` entry using the **identical** specifier, with `.catch()`
- [ ] One `MODULES` entry
- [ ] Matching skeleton component
- [ ] Root `rstest.config.ts` aliases
- [ ] `ci-billing.yml` + `deploy.yml` loops
