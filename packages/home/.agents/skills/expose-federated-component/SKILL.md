---
name: expose-federated-component
description: Add a new component to a remote's `exposes` map so the shell can import it. Use when asked to expose a component, share a component with the host, extend a remote's public API, or add a new federated entry point.
---

# Expose a Federated Component

An `exposes` entry is a **public API contract with another team**, not an import path.
Once the shell imports it, renaming or removing it is a breaking change that fails at
runtime rather than at build time.

This skill lives in `home`, but the procedure is identical for `records`,
`prescriptions`, and `analytics`.

## Before you expose anything, decide whether you should

Ask: is this a **route-level view** the host will render, or an internal implementation
detail? Expose the former. Exposing internals turns every refactor into a
cross-team negotiation.

The convention here is exactly two exposed entries per remote: the plain component and
its `Streaming*` wrapper. That is usually the right number.

## 1. The component must be a self-sufficient entrypoint

This is the rule people get wrong. **The host never executes your `bootstrap.tsx`.** When
the shell renders `home/Home`, only that module and its imports run.

So the exposed component must itself:

- `import "./index.css"` — its own styles
- Perform any initialization it depends on
- Work with **no** host present (standalone dev on its port)
- Work with **no** router in scope — the shell owns routing; a remote cannot use
  `react-router-dom` hooks

```tsx
// src/Home.tsx — exposed, therefore an entrypoint
import { useCallback, memo } from "react";
import { useActiveTheme } from "./lib/theme";
import "./index.css";        // ← required: bootstrap.tsx will not run for the host
```

To navigate, ask the host:

```ts
window.dispatchEvent(
  new CustomEvent("navigateToModule", { detail: { module: "records" } })
);
```

## 2. Add the key to `exposes`

```ts
new rspack.container.ModuleFederationPlugin({
  name: "home",
  filename: "remoteEntry.js",
  exposes: {
    "./Home":          "./src/Home.tsx",
    "./StreamingHome": "./src/StreamingHome.tsx",
    "./PatientBanner": "./src/PatientBanner.tsx",   // ← new
  },
  shared: { /* leave React singletons alone */ },
})
```

- The key **must** start with `./`. The host imports it as `home/PatientBanner`.
- The value is a path relative to the package root.
- Do not touch `shared` while adding an expose. React singletons are federation-wide
  invariants.

## 3. Declare the ambient type in the host

`packages/shell/src/types.d.ts`:

```ts
declare module "home/PatientBanner" {
  const PatientBanner: import("react").ComponentType;
  export default PatientBanner;
}
```

If the component takes props, type them properly rather than falling back to
`ComponentType<any>`:

```ts
declare module "home/PatientBanner" {
  const PatientBanner: import("react").ComponentType<{ patientId: string }>;
  export default PatientBanner;
}
```

**This declaration is hand-maintained and is the only thing keeping the host type-safe
across the boundary.** It can drift from the real component with no compiler complaint in
either package. Treat it as part of the contract and update both together.

## 4. Add the test alias

Root `vitest.config.ts`, in `resolve.alias`:

```ts
"home/PatientBanner": path.resolve(__dirname, "packages/home/src/PatientBanner.tsx"),
```

Without it, every test that imports the specifier fails to resolve.

## 5. Consume it in the host through `loadRemote()`

Never `lazy(() => import("home/PatientBanner"))` directly — an unreachable remote would
reject and take out the route. Route-level views go through `loadRemote()`; see
`packages/shell/.agents/skills/wire-new-remote/`.

## Props across the boundary: keep them serializable-shaped

Props cross a module boundary between separately deployed bundles. Prefer plain data —
strings, numbers, plain objects, and simple callbacks. Avoid passing class instances,
React context values, or anything relying on shared module identity that is not in
`shared`. The two sides may be running different builds.

## Removing or renaming an exposed key

Treat it as a breaking API change:

1. Confirm nothing in the shell imports it (`grep -rn "home/PatientBanner" packages/shell/src`).
2. Remove from `exposes`, `types.d.ts`, and `vitest.config.ts` together.
3. In a real deployment, the host and remote ship independently — a removed key breaks
   any host build still importing it. Deprecate before deleting.

## Verify

```bash
cd ../.. && pnpm typecheck && pnpm test && pnpm build
```

Then start both the remote and the shell and confirm the component renders **through the
federation**, not just standalone — that is what proves the expose worked. Check the
browser console for `Loading script failed`, which means the key does not match.

## Checklist

- [ ] Component imports its own CSS and needs no bootstrap, no router, no host
- [ ] `exposes` key starts with `./`
- [ ] Ambient declaration in `packages/shell/src/types.d.ts`, props typed
- [ ] Alias in root `vitest.config.ts`
- [ ] Host consumes it via `loadRemote()`
- [ ] `shared` untouched
