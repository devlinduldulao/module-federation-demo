# AGENTS.md — `home` (remote)

Extends the root [`../../AGENTS.md`](../../AGENTS.md). Rules here win inside
`packages/home/`.

**Role:** remote. Port **3004**. Federation name `home`. It is the shell's landing route
(`/`) and the federation's front door.

---

## Federation contract

```ts
exposes: {
  "./Home":          "./src/Home.tsx",
  "./StreamingHome": "./src/StreamingHome.tsx",
}
```

The shell imports these as `home/Home` and `home/StreamingHome`. Both keys are a public
API. **Renaming or removing one breaks the host at runtime, not at build time** — the
shell's `loadRemote()` will swallow the failure and render `<ModuleFallback />`, so a
broken contract shows up as a fallback card rather than a red error.

Changing `exposes` is a three-file change:

1. `rspack.config.ts` here
2. `packages/shell/src/types.d.ts` — the ambient declaration
3. `rstest.config.ts` at the root — the test alias

---

## `home` is the `instant` module — keep it that way

The shell imports `home/Home`, **not** `home/StreamingHome`, and marks it
`loadStrategy: "instant"`. It is the first thing a user sees, so it must render as soon
as its chunk arrives. `StreamingHome.tsx` exists for parity with the other remotes and
for standalone demonstration; it is not what the shell renders on `/`.

Practical consequence: **do not add artificial delay, blocking data fetches, or a
suspending resource to `Home.tsx`.** Anything slow belongs in `StreamingHome.tsx`.

`performance.maxAssetSize` is 256000 here — half the shell's budget. Home is the
lightest module in the federation and should stay that way.

---

## `Home.tsx` is a navigation surface, not a page with links

Home does not use a router. It cannot — the router lives in the shell, and Home must also
work standalone on port 3004 where no router exists. Instead it **asks the host to
navigate** by dispatching an event:

```ts
window.dispatchEvent(
  new CustomEvent("navigateToModule", { detail: { module: destination.id } })
);
```

The shell listens and performs the actual route change. It also dispatches
`showNotification` to surface a toast through the host's single `<Toaster />`.

**Never import `react-router-dom` in this package.** It is not a dependency here, and
adding it would create a second router instance inside the host's tree.

`MODULE_DESTINATIONS` in `Home.tsx` hardcodes each sibling module's `id`, `port`, and
`path`. If a port or route changes anywhere in the federation, this array needs the same
edit.

---

## Standalone mode must keep working

```bash
pnpm dev   # http://localhost:3004
```

`src/index.tsx` is `import("./bootstrap")` and nothing else — the async boundary required
by `eager: false` shared React. `bootstrap.tsx` mounts `<Home />` directly with no
`StrictMode` wrapper and imports `./index.css`.

Because the host never runs `bootstrap.tsx`, **`Home.tsx` imports `./index.css` itself.**
Keep that import. Every exposed component in this repo carries its own styles.

In standalone mode `window.__MF_THEME__` is absent, so `getThemeFromHost()` falls back to
`localStorage`, then to `"dark"`. Both paths must render correctly.

---

## Theme

`src/lib/theme.ts` here is a **read-only consumer**. `useActiveTheme()` reads
`window.__MF_THEME__?.getTheme()` and subscribes to the `themeChange` event. There is no
`setTheme`, no `applyTheme`, and no persistence — the host owns all of that.

Do not add theme-writing code to this package. If Home needs to change the theme, it
should dispatch an event and let the shell decide.

---

## Local conventions

- 2-space indentation (matches `records`; `prescriptions` and `analytics` use 4).
- `resolve.alias` provides `@`, `@components`, `@lib` — available here, unlike in
  `prescriptions` and `analytics`.
- Types live in `src/types.ts` (`ModuleDestination`); `src/global.d.ts` holds the CSS
  module declaration.
- Design system is **shadcn/ui (neutral)**. Use only shadcn semantic tokens —
  `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`,
  `accent`, `destructive`, `border`, `input`, `ring`, and `chart-1`..`chart-5`.
  **Do not introduce a brand colour or a new CSS variable.** shadcn has no success or
  warning token: use `chart-2` for success/healthy and `chart-4` for warning, and
  `destructive` for errors.
- Fonts are the two shadcn/ui uses: **Geist** (`font-sans`, the default) and
  **Geist Mono** (`font-mono`, for labels, ports, and figures). Headings are upright
  `font-sans font-semibold` — no display serif, no italic.
- Radius comes from `--radius` (shadcn default `0.625rem`): `rounded-lg` for card
  surfaces, `rounded-md` for controls, badges, and skeleton blocks.

---

## Verify

```bash
cd ../.. && pnpm typecheck && pnpm test && pnpm build
```

Then check both modes: standalone on `:3004`, and composed inside the shell on `:3000/`.

---

## Skills in this package

- `.agents/skills/expose-federated-component/` — add a new `exposes` entry safely
