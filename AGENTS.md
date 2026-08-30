# AGENTS.md — Module Federation Demo (root)

Operating instructions for coding agents working anywhere in this repository.

**This file is not a tutorial.** It states the invariants, contracts, and verification
gates that changes here must respect, plus the consequence of breaking each one. For the
conceptual tour — what the architecture is, why it is shaped this way, how to run it, a
walkthrough of the UI — read [`README.md`](./README.md) instead. Deliberately, the two do
not duplicate each other:

| | `README.md` | `AGENTS.md` (this file) |
|---|---|---|
| Answers | "How does this work and how do I run it?" | "What must I not break while changing it?" |
| Voice | Descriptive | Imperative |
| Read | Once, top to bottom | As reference, closest file wins |

## How to use this file

1. **Read the closest `AGENTS.md` to the file you are editing.** This one covers the whole
   monorepo; each package has its own that overrides and extends it. Editing
   `packages/records/src/MedicalRecords.tsx` means `packages/records/AGENTS.md` wins
   wherever the two disagree.
2. **Check `.agents/skills/` before starting a recognised task** — adding a remote,
   exposing a component, debugging a remote that will not load, and so on. The skill is
   more specific than this file and encodes the order of operations.
3. **Run the verification gates below before reporting work as done.** In this repo a
   green build does not prove the app works; federation binds at runtime.

---

## What this repository is

Five independently built React applications composed at runtime into one app using
**Rspack 2.2 Module Federation**. One host, four remotes.

| Package | Role | Dev port | Federation name | Exposes / Consumes |
|---|---|---|---|---|
| `packages/shell` | **Host** | 3000 | `shell` | Consumes all four remotes |
| `packages/home` | Remote | 3004 | `home` | `./Home`, `./StreamingHome` |
| `packages/records` | Remote | 3001 | `records` | `./MedicalRecords`, `./StreamingMedicalRecords` |
| `packages/prescriptions` | Remote | 3002 | `prescriptions` | `./PrescriptionOrders`, `./StreamingPrescriptionOrders` |
| `packages/analytics` | Remote | 3003 | `analytics` | `./ClinicalAnalytics`, `./StreamingClinicalAnalytics` |

Each package has its **own `package.json` and its own `pnpm-lock.yaml`**. This is
deliberate: it simulates five separately owned repositories. There is no pnpm
workspace linking packages together — they only meet at runtime, over HTTP, through
`remoteEntry.js`.

---

## Nested agent context in this repo

This repository intentionally demonstrates **hierarchical agent instructions**.
Nothing here is loaded all at once; the closest file to your work wins.

```
AGENTS.md                                  ← you are here (repo-wide rules)
.agents/skills/                            ← repo-wide skills
  verify-federation/                         (authored here)
  rstest-testing/                            (authored here)
  rspack-best-practices/                     (vendored, see skills-lock.json)
  rspack-debugging/                          (vendored)
  rspack-v2-upgrade/                         (vendored)
  rsbuild-best-practices/                    (vendored)
  rsbuild-v2-upgrade/                        (vendored)
  migrate-to-rsbuild/                        (vendored)
  rsdoctor-analysis/                         (vendored)

packages/shell/AGENTS.md                   ← host-only rules
packages/shell/.agents/skills/
  wire-new-remote/                           add a remote to the host, end to end
  debug-federation-runtime/                  diagnose a remote that will not load

packages/home/AGENTS.md                    ← remote-only rules
packages/home/.agents/skills/
  expose-federated-component/                add a new entry to exposes safely

packages/records/AGENTS.md
packages/records/.agents/skills/
  streaming-suspense-remote/                 the Resource + Suspense pattern

packages/prescriptions/AGENTS.md
packages/prescriptions/.agents/skills/
  cross-module-events/                       typed CustomEvent contracts on window

packages/analytics/AGENTS.md
packages/analytics/.agents/skills/
  remote-bundle-budget/                      keep a remote inside its size budget
```

**Vendored vs authored skills.** Skills listed in `skills-lock.json` are pulled from
`rstackjs/agent-skills` and pinned by hash. **Do not hand-edit them** — changes will be
overwritten on the next sync and will invalidate `computedHash`. Skills not in the
lockfile are authored in this repo and are yours to edit.

---

## Commands

Run from the repository root unless stated otherwise.

```bash
pnpm run install:all      # install root + all five packages (required on first clone)
pnpm dev                  # start all five dev servers concurrently
pnpm build                # production build of all five packages
pnpm typecheck            # tsc --noEmit across all five packages
pnpm test                 # rstest run (one root project, covers all packages)
pnpm test:watch           # rstest watch
pnpm test:coverage        # rstest with v8 coverage
pnpm run kill:ports       # free ports 3000-3004 when a dev server is stranded
```

Single package (standalone development):

```bash
cd packages/records && pnpm dev      # http://localhost:3001, runs on its own
```

### Verification gates before you call work done

Run these three, in this order:

```bash
pnpm typecheck && pnpm test && pnpm build
```

---

## Developing one package at a time

This is the payoff of the architecture, and it works: **a remote runs completely on its
own.** Verified by starting only `records` with ports 3000/3002/3003/3004 confirmed down —
it served on :3001 and rendered its full UI.

```bash
cd packages/records && pnpm dev     # :3001, nothing else needed
```

| Working on | Run | Processes |
|---|---|---|
| A remote's own UI | that remote alone | 1 |
| Shell chrome, routing, theme | shell alone — modules show their fallback | 1 |
| Host ↔ remote integration | shell + the one remote | 2 |

Standalone, a remote has no host: `window.__MF_THEME__` is undefined and
`useActiveTheme()` falls back to `localStorage` then `"dark"`, dispatched events have no
listener, and there is no router. All of that is by design — but it means **standalone is a
genuinely different code path**, and it is where async-boundary and `lazyCompilation`
regressions surface first.

The **shell alone** boots and stays fully interactive (nav, theme, command palette), but
every module region degrades to its `<ErrorBoundary>` — *"Something went wrong. There was
an error loading this module."* — with a Retry button. That is fault isolation working, not
a bug.

### HMR: you get auto-reload, not Fast Refresh

**Edits apply automatically — but as a full page reload, so component state is lost.**
Do not expect to keep a filled-in form or a scroll position across a save.

This was established empirically with a `window` sentinel that survives Fast Refresh and
dies on reload. It died on every edit. The console explains it:

```
[HMR] Cannot find update. Need to do a full reload!
```

Two separate causes stack up:

1. **`output.clean: true` deletes the `.hot-update.json` files** the HMR client then tries
   to fetch. It cannot find them, so it reloads the page. The reload is the only reason
   your edit becomes visible.

2. **`ModuleFederationPlugin` breaks Fast Refresh underneath.** With MF temporarily
   disabled, Fast Refresh worked perfectly — the update applied *and* the sentinel
   survived. With MF on and `clean` disabled, the page stops reloading but the console
   says `[HMR] Nothing hot updated.` and the change silently never appears, which is
   worse. MF adds a second entrypoint (the `<name>` container alongside `main`), so a
   module ends up in two runtimes and the update lands in the one that is not rendering.

**Do not "fix" this by setting `clean: !isDev` on its own** — that trades a working reload
for a silently stale page. Both halves have to be solved together.

Ruled out: `reactCompiler: true` is not the cause (tested with it off — identical reload).
Verified on `records`; the other three remotes have identical config, so the same is
expected but was not separately confirmed.

---

## The three properties that make this federated

Every `rspack.config.ts` here is an ordinary Rspack config — `entry`, `module.rules`,
`resolve`, `devServer`, `optimization` are all things a normal single-page app has.
**Only `ModuleFederationPlugin` makes these five apps into one.** Within it, three
properties carry the entire architecture:

- **`exposes`** (remotes only) — the module's public API. This is a **contract with
  other teams**. Changing or removing a key is a breaking change for the host.
- **`remotes`** (host only) — where to fetch each remote's `remoteEntry.js` at runtime.
  Format is `scope@URL`. Runtime discovery, not a build-time dependency.
- **`shared`** (both) — dependencies deduplicated across the federation. `react`,
  `react-dom`, and `react-dom/client` are `singleton: true` in **all five** packages.
  Without that, each remote loads its own React and hooks break at runtime with
  "Invalid hook call".

Every `rspack.config.ts` in this repo is annotated property by property. Read the
config before changing it.

---

## Hard rules (breaking these produces a white screen, not a build error)

1. **Never remove the async boundary.** Every `src/index.tsx` is exactly
   `import("./bootstrap");` and nothing else. Shared modules are `eager: false`, so React
   must be resolved asynchronously. Inlining `bootstrap.tsx` into `index.tsx` fails at
   runtime with `loadShareSync` errors.

2. **Never set `lazyCompilation: true`** (or delete the explicit `lazyCompilation: false`).
   Rspack 2.2's CLI defaults `lazyCompilation.imports` to `true` for browser targets,
   which proxies `import("./bootstrap")` and races shared React. Result: blank page in
   standalone mode.

3. **Keep `singleton: true` on all three React entries** in all five configs, and keep
   `requiredVersion` aligned with the installed React across packages.

4. **Anything listed in `exposes` is a real runtime entrypoint.** It must import its own
   CSS and perform its own side effects. It cannot rely on `bootstrap.tsx`, because the
   host never executes the remote's bootstrap.

5. **Do not add cross-package imports.** `packages/records` may not `import` from
   `packages/shell` or vice versa. The only legal cross-package channels are federated
   imports (`records/MedicalRecords`) and `window` CustomEvents.

6. **Ports are part of the contract.** The shell's `remotes` map and `App.tsx`'s
   `MODULES` registry both hardcode remote ports. If you change a port, change it in the
   remote's `devServer.port`, the shell's `remoteUrl()` call, and `MODULES`.

---

## Stack conventions

- **React 19.2** with the automatic JSX runtime. No `import React from "react"` needed
  for JSX (existing files that have it are fine — leave them).
- **React Compiler is on** via `jsc.transform.reactCompiler: true` in `builtin:swc-loader`
  (the Rust port, new in Rspack 2.2). Auto-memoization happens at build time — **do not
  add `useMemo` / `useCallback` / `React.memo` for performance reasons**. Add them only
  when you need referential stability for correctness (a dependency array, a context
  value).
- **TypeScript, strict.** No `any`. Federated remote modules are typed via ambient
  declarations — see `packages/shell/src/types.d.ts`.
- **Each package's `tsconfig.json` includes its own `rspack.config.ts`**
  (`"include": ["src/**/*", "rspack.config.ts"]`) and deliberately has **no `rootDir`**.
  Without the include, the config file belongs to no TS project, so editors fall back to
  an inferred project with no `types: ["node"]` and red-underline `node:path` / `node:url`
  even though `@types/node` is installed. `rootDir: "./src"` cannot come back — it makes
  tsc reject the config file as outside the root. Nothing is emitted from tsc here
  (`noEmit: true`; Rspack does the building), so `rootDir`/`outDir` control nothing.
  Upside: `pnpm typecheck` now type-checks the Rspack configs too.
- **Tailwind CSS v4** via `@tailwindcss/postcss`. There is no `tailwind.config.js`;
  theming lives in each package's `src/index.css` as CSS custom properties.
- **Design system is shadcn/ui (neutral).** Use **only** shadcn semantic tokens:
  `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`,
  `accent`, `destructive`, `border`, `input`, `ring`, `chart-1`..`chart-5`.
  **Never add a brand colour or a new colour CSS variable** — the whole point is that the
  hand-written screens and the vendored `components/ui/` cannot drift apart. shadcn has no
  success/warning token: use `chart-2` for success, `chart-4` for warning, `destructive`
  for errors.
- **Fonts are Geist and Geist Mono**, the two families shadcn/ui uses, loaded from
  `@fontsource-variable/geist` and `@fontsource-variable/geist-mono`. `font-sans` is the
  default; `font-mono` is for labels, ports, and figures. Headings are upright
  `font-sans font-semibold` — no display serif, no italic. Do not add a third family.
- **Radius** comes from `--radius` (shadcn default `0.625rem`): `rounded-lg` for card
  surfaces, `rounded-md` for controls, badges, and skeleton blocks.
- **Theme switching toggles the `.dark` class on `<html>`** and nothing else.
  `src/lib/theme.ts` must not write colour variables at runtime.
- **shadcn-style components** built on `@base-ui/react`, in `src/components/ui/`. These
  are vendored source, not a dependency — edit them in place when needed.
- **`cn()`** from `src/lib/utils.ts` is the only class-merging helper. Use it.
- **`lucide-react`** for icons. **`sonner`** for toasts (the host owns the `<Toaster />`;
  remotes request a toast by dispatching a `showNotification` event).
- Each remote duplicates its own `components/ui/` and `lib/`. **This duplication is
  intentional** — it keeps remotes independently deployable. Do not "DRY it up" into a
  shared package.

---

## Testing — Rstest

This repo uses **[Rstest](https://rstest.rs)**, the Rspack-native test runner, not Vitest.
One root project covers every package: `rstest.config.ts`,
`include: ["packages/*/src/**/*.test.{ts,tsx}"]`, jsdom environment.

Test files are built by Rspack/SWC before they run, so they compile through the same Rust
toolchain as the apps — one transform pipeline instead of two.

### The API, in one table

| Vitest | Rstest | Note |
|---|---|---|
| `from "vitest"` | `from "@rstest/core"` | Everything comes from the one package |
| `vi.fn` / `vi.mock` / `vi.spyOn` | `rs.fn` / `rs.mock` / `rs.spyOn` | The namespace is `rs`, not `vi` |
| `vi.useFakeTimers()`, `vi.advanceTimersByTimeAsync()` | `rs.useFakeTimers()`, `rs.advanceTimersByTimeAsync()` | Same names under `rs` |
| `vi.stubGlobal`, `vi.restoreAllMocks` | `rs.stubGlobal`, `rs.restoreAllMocks` | |
| `test.environment` | `testEnvironment` | Top level — Rstest has no `test` wrapper |
| `alias` / `dedupe` | `resolve.alias` / `resolve.dedupe` | |
| `pool: "forks"` | `pool: { type: "forks" }` | An object, not a string |
| `@vitest/coverage-v8` | `@rstest/coverage-v8` | Same V8 engine |
| `vitest run` / `vitest` | `rstest run` / `rstest watch` | Rstest is single-run by default |

`describe`, `it`, `test`, `expect`, `beforeEach`, and `afterEach` are unchanged.

### Rules

- Tests live beside their subject: `MedicalRecords.tsx` → `MedicalRecords.test.tsx`.
- **Import from `@rstest/core` and use `rs.*`.** Never reintroduce `vitest` or `vi.*`.
- `rstest.config.ts` aliases federated specifiers (`records/MedicalRecords`, …) to real
  source files, and pins `react` / `react-dom` to the **root** `node_modules` copy to
  avoid duplicate-React "Invalid hook call" failures. **If you add a new `exposes` entry,
  add a matching alias there**, or any test importing it will fail to resolve.
- `rstest.setup.ts` registers the jest-dom matchers with `expect.extend()`, provides the
  `localStorage` mock, and runs Testing Library `cleanup()` after each test. Rstest has no
  self-registering `@testing-library/jest-dom/vitest` entry point — that `expect.extend()`
  call is what makes `toBeInTheDocument()` exist.
- Use `@testing-library/react`; query by role and accessible name, not by test id.
- Streaming components cache their Suspense resource in a module-level `Map`. Call the
  exported `__reset*StreamingResourceCache()` in `beforeEach`, or the second test in a
  file will not suspend.
- Each package tsconfig lists `"@rstest/core/globals"` in `compilerOptions.types`. A new
  package needs the same entry.
- Run one package with a path filter: `pnpm test packages/records/src`. Note there is
  **no `--`** before the path — pnpm v11 does not forward args after `--` here, and the
  filter is silently dropped, running the whole suite.

Full detail is in `.agents/skills/rstest-testing/`.
---

## Deployment

`.github/workflows/deploy.yml` builds the four remotes with `publicPath: "auto"`, then
builds the shell with `REMOTE_BASE_URL` and `BASE_PATH` pointing at the GitHub Pages
site, and assembles:

```
/                        → shell
/remotes/<name>/         → each remote's remoteEntry.js + chunks
```

`packages/shell/rspack.config.ts` reads those two env vars. Local dev (no env vars) falls
back to `http://localhost:<port>`. Keep both code paths working.

Per-module workflows (`ci-<name>.yml`) run only when that module's files change, which is
what independent deployability looks like in CI. `ci.yml` is the full-repo safety net.

---

## Working style in this repo

- Change one package at a time. If a change requires edits in two packages, say so
  explicitly — that is a federation contract change and deserves attention.
- Prefer Rspack built-ins (`builtin:swc-loader`, `HtmlRspackPlugin`, `type: "css"`) over
  community webpack plugins. They are faster and already configured.
- When a remote will not load, do not start by editing configs. Use the
  `debug-federation-runtime` skill in `packages/shell/.agents/skills/` — the cause is
  almost always a dev server that is not running, a port mismatch, or a stale persistent
  cache.
