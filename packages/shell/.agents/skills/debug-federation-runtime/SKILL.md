---
name: debug-federation-runtime
description: Diagnose a federated remote that fails to load at runtime — white screen, "Module Unavailable" fallback card, Invalid hook call, loadShareSync errors, ChunkLoadError, or "Loading script failed". Use before editing any rspack.config.ts in response to a broken remote.
---

# Debug Federation at Runtime

Module Federation failures are **runtime** failures. The build is green, the types are
green, and the page is blank. Diagnose from the symptom — do not start by rewriting
configs, which usually adds a second bug on top of the first.

## Rule zero: read the browser console first

The console message identifies the failure class almost every time. Get it before
forming a hypothesis.

---

## Symptom: "Module Unavailable" fallback card

The shell rendered `<ModuleFallback />`, which means `loadRemote()` caught a rejected
`import()`. The federation is working correctly — it isolated a failure. Now find it.

**Check in this order:**

1. **Is the remote's dev server running?** Open `http://localhost:<port>/remoteEntry.js`
   directly. If it 404s or refuses the connection, that is your answer.

   ```bash
   curl -I http://localhost:3001/remoteEntry.js
   ```

2. **Port mismatch.** The port must agree in three places: the remote's
   `devServer.port`, the `remoteUrl(name, port)` call in the shell's config, and the
   `port` field in `MODULES`. Grep all three.

3. **Name mismatch.** The remotes key in the shell, the `name` in the remote's
   `ModuleFederationPlugin`, and the remote's `output.uniqueName` must all be identical.

4. **Exposed key mismatch.** The shell imports `records/StreamingMedicalRecords`; the
   remote must expose exactly `"./StreamingMedicalRecords"`. Case-sensitive.

5. **Stale config in a running dev server.** Rspack does not always pick up
   `rspack.config.ts` changes. Restart the affected server.

---

## Symptom: white screen, console says `loadShareSync` or "Shared module is not available for eager consumption"

The async boundary is broken. Shared React is `eager: false`, so it must be resolved
asynchronously.

**Check:**

1. `src/index.tsx` must be **exactly** `import("./bootstrap");` with no other statement.
   A static `import React from "react"` at the top of `index.tsx` breaks it.

2. `lazyCompilation` must be `false`. Rspack 2.1's CLI defaults
   `lazyCompilation.imports` to `true` for browser targets, which proxies
   `import("./bootstrap")` and races shared React. Every config in this repo sets it
   explicitly for that reason.

   ```bash
   grep -L "lazyCompilation: false" packages/*/rspack.config.ts
   ```

   Any file listed by that command is missing the setting.

3. Someone set `eager: true` on a `shared` entry. Do not "fix" the async boundary by
   flipping this — it defeats sharing and inflates every bundle.

---

## Symptom: `Invalid hook call` / `Cannot read properties of null (reading 'useState')`

Two copies of React are live. Hooks resolve against a different React instance than the
one that rendered.

**Check:**

1. **`singleton: true` on all three specifiers** — `react`, `react-dom`, **and**
   `react-dom/client` — in **all five** configs. Missing `react-dom/client` is the
   common one; it is a separate module specifier in React 18+ and is easy to overlook.

2. **Version skew.** `requiredVersion` is `^19.2.7` everywhere and `strictVersion` is
   `false`, so a minor mismatch resolves rather than throwing. But if one package has
   React 18 installed, singleton resolution picks one and the other breaks. Compare:

   ```bash
   grep -h '"react":' packages/*/package.json
   ```

3. **In tests, not the browser?** That is a different cause — `vitest.config.ts` pins
   `react`/`react-dom` to the **root** `node_modules` copy and sets
   `dedupe: ["react", "react-dom"]`. If a new package was added, it needs the same
   treatment.

---

## Symptom: `ChunkLoadError` / "Loading chunk N failed" in production only

A `publicPath` problem. The remote's chunks are being requested from the wrong origin.

**Check:**

1. Remotes use `publicPath: "auto"`, which resolves chunk URLs relative to where
   `remoteEntry.js` was loaded from. Do not hardcode a `publicPath` in a remote.

2. The shell uses `publicPath: BASE_PATH ? \`${BASE_PATH}/\` : "auto"` because GitHub
   Pages serves it from a subdirectory. Confirm `BASE_PATH` and `REMOTE_BASE_URL` are
   both set in the deploy workflow's "Build shell" step.

3. Confirm the deployed layout matches what `remoteUrl()` builds:
   `${REMOTE_BASE_URL}/remotes/<name>/remoteEntry.js`.

---

## Symptom: styles missing when loaded through the shell, fine standalone

The exposed component is relying on `bootstrap.tsx` for its CSS. **The host never runs a
remote's `bootstrap.tsx`.** Anything in `exposes` is a real entrypoint and must
`import "./index.css"` itself.

---

## Symptom: a change does not appear, or the build behaves as if code is old

Persistent cache. Every config uses `cache: { type: "persistent" }`. It self-cleans
(7-day `maxAge`, 3 `maxVersions`), but a config change can leave a stale entry.

```bash
pnpm run kill:ports
rm -rf packages/*/node_modules/.cache packages/*/dist
pnpm dev
```

---

## Symptom: the skeleton flashes on every navigation, or a test never suspends

The streaming resource cache. Each `Streaming*.tsx` caches its resource in a module-level
`Map` so re-renders do not restart the delay.

- Flashing on every navigation → something is clearing or re-creating that module scope.
- A test that will not suspend → the cache is warm from a previous test. Call
  `__reset<Name>StreamingResourceCache()` in `beforeEach`.

---

## Escalation

For crashes **inside the Rspack process** — segfaults, hangs, deadlocks rather than
browser-side failures — use the repo-wide `rspack-debugging` skill in
`.agents/skills/rspack-debugging/`, which covers LLDB backtraces.

For bundle size and dependency-graph questions, use `.agents/skills/rsdoctor-analysis/`.

## After the fix

Run the `verify-federation` skill. A federation fix is not confirmed by a build — it is
confirmed by all five servers running and every route rendering with a clean console.
