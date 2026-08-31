---
name: verify-federation
description: Verify that all five apps in this Module Federation monorepo still compose correctly after a change. Use before finishing work that touched any rspack.config.ts, any exposes/remotes/shared entry, src/index.tsx, bootstrap.tsx, ports, or the shell's module registry.
---

# Verify Federation

A green `pnpm build` does **not** prove this app works. Module Federation binds at
runtime, so a broken `exposes` key, a missing `singleton`, or a removed async boundary
compiles perfectly and fails in the browser. This skill is the runtime check.

## When to run this

Run it after changing any of:

- `packages/*/rspack.config.ts` — especially `exposes`, `remotes`, `shared`, `output.uniqueName`, `devServer.port`
- `packages/*/src/index.tsx` or `bootstrap.tsx`
- `packages/shell/src/App.tsx` (the `MODULES` registry) or `src/types.d.ts`
- Any React / react-dom version in any `package.json`

## Step 1 — Static gates

```bash
pnpm typecheck && pnpm test && pnpm build
```

## Step 2 — Static invariants

Check each by reading, not guessing. Every one of these is a runtime white screen if wrong.

1. **Async boundary intact** — every `packages/*/src/index.tsx` contains exactly
   `import("./bootstrap");` and no static import of React.

   ```bash
   for p in shell home records prescriptions analytics; do
     echo "--- $p"; cat packages/$p/src/index.tsx; done
   ```

2. **`lazyCompilation: false`** present in all five configs.

   ```bash
   grep -c "lazyCompilation: false" packages/*/rspack.config.ts
   ```

3. **React shared as a singleton** in all five configs, for all three specifiers
   (`react`, `react-dom`, `react-dom/client`).

   ```bash
   grep -A2 '"react-dom/client"' packages/*/rspack.config.ts | grep singleton
   ```

4. **`output.uniqueName` matches the federation `name`** in each config, and every
   `name` is unique across the five.

5. **Ports agree in three places** — the remote's `devServer.port`, the shell's
   `remoteUrl(name, port)` argument, and the `port` field in the shell's `MODULES` array.

6. **Every `exposes` key has an ambient type** in `packages/shell/src/types.d.ts` **and**
   an alias in the root `rstest.config.ts`.

## Step 3 — Runtime check

```bash
pnpm run kill:ports    # clear anything stranded on 3000-3004
pnpm dev               # starts all five
```

Then, in the browser:

- **`http://localhost:3000/`** — Home renders immediately, no skeleton flash.
- **`/records`** — renders with no delay (it was prefetched on shell mount).
- **`/prescriptions`** and **`/analytics`** — a skeleton appears, then the real view.
  The skeleton should appear **once per page load**, not on every navigation.
- **No `<ModuleFallback />` cards.** A fallback card means that remote failed to load —
  its `remoteEntry.js` is unreachable or its `exposes` key does not match.
- **Browser console clean.** Specifically absent: `Invalid hook call`, `loadShareSync`,
  `Shared module is not available for eager consumption`, `Loading script failed`.

Each remote must also boot on its own — `:3001`, `:3002`, `:3003`, `:3004`. Standalone
mode exercises a different code path (no `window.__MF_THEME__`, no host router), and it
is where async-boundary and `lazyCompilation` regressions show up first.

## Step 4 — Cross-module event flow

**Order matters here, and the obvious sequence tests the wrong thing.** An event only
reaches a module whose chunk has been *loaded*. `prescriptions` is a `streamed` module, so
on a cold page load its code does not exist yet and it cannot listen to anything. Visit
`/prescriptions` first, or you are testing a case the architecture cannot satisfy.

Navigate with the in-app nav links, not by typing URLs — a full page load unloads every
remote and resets the experiment.

1. Open `/`, then click through to **`/prescriptions`**. This loads the chunk and registers
   its module-scope listener.
2. Click to **`/records`**. Prescriptions is now loaded but unmounted.
3. Add a prescription for a patient who is **not** in the seed data (`Sarah Chen` and
   `Lisa Nguyen` are seeded — using them gives a false pass).
4. A toast appears, dispatched by Records and rendered by the shell's single `<Toaster />`.
5. Click back to **`/prescriptions`** — the row is there, **exactly once**.
6. Repeat steps 2-5. Still exactly once. Duplicates mean the listener got registered twice,
   not that a cleanup is missing — it lives at module scope and is intentionally never
   removed.

**Known limit, by design:** if `prescriptions` has never been loaded in this page session,
step 3 is lost. Nothing is listening, and there is no replay. Events are live notification
between loaded modules, not durable transport — durable data belongs on a server. See
`packages/prescriptions/.agents/skills/cross-module-events/`.

## Step 5 — Production path

`pnpm build` alone does not exercise the deployed URL wiring. If you changed
`publicPath`, `REMOTE_BASE_URL`, or `BASE_PATH`, confirm both branches of `remoteUrl()`
in `packages/shell/rspack.config.ts` still produce valid URLs — local
(`http://localhost:<port>/remoteEntry.js`) and Pages
(`${REMOTE_BASE_URL}/remotes/<name>/remoteEntry.js`).

## Reporting

State plainly which steps you ran and what you observed. If you ran the static gates but
could not start dev servers, say so — do not describe the runtime checks as passing when
they were not performed.
