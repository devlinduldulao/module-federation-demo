# AGENTS.md — `prescriptions` (remote)

Extends the root [`../../AGENTS.md`](../../AGENTS.md). Rules here win inside
`packages/prescriptions/`.

**Role:** remote. Port **3002**. Federation name `prescriptions`. Route `/prescriptions`
in the shell. Domain: active prescription orders and refill management.

---

## Federation contract

```ts
exposes: {
  "./PrescriptionOrders":          "./src/PrescriptionOrders.tsx",
  "./StreamingPrescriptionOrders": "./src/StreamingPrescriptionOrders.tsx",
}
```

The shell imports **`prescriptions/StreamingPrescriptionOrders`** — the suspending
variant. Both keys are public API; changing them requires matching edits in
`packages/shell/src/types.d.ts` and the root `rstest.config.ts` alias map.

---

## `prescriptions` is a `streamed` module

The shell loads this remote on demand behind `<PrescriptionsSkeleton />`. Nothing is
prefetched. The user clicks, the chunk downloads, the skeleton shows, then the streaming
wrapper's cached resource resolves and the real table renders.

This means **the skeleton is part of the module's UX contract**. It lives in the shell
(`packages/shell/src/components/PrescriptionsSkeleton.tsx`) and mirrors this module's
layout. If you significantly change the layout of `PrescriptionOrders.tsx`, the skeleton
in the shell should change with it, or the transition will visibly jump.

---

## This is the consumer end of the cross-module event bus

Prescriptions is the only module that **listens** for domain events. Records dispatches
`addPrescription`; this module receives it:

The listener and the list both live in `src/lib/prescriptions-store.ts`, at **module
scope** — not in the component:

```ts
// src/lib/prescriptions-store.ts
if (typeof window !== "undefined") {
  window.addEventListener("addPrescription", (event) => {
    usePrescriptionsStore.getState().add(event.detail);
  });
}
```

Rules that matter here more than anywhere else in the repo:

1. **Keep this listener at module scope, and keep the list in the store.** This module is
   `streamed`, so it is unmounted most of the time — Records usually dispatches while the
   user is on `/records`, not here. A `useEffect` listener would not exist at that moment
   and the event would be lost; `useState` would then throw away whatever it did collect
   on the next remount. Module scope plus the `localStorage` seed is what makes delivery
   survive both.

   The trade is that the listener is never removed and the state outlives unmount, so
   **tests must call `__resetPrescriptionsStore()` in `beforeEach`** or each test inherits
   the previous one's rows.

   **Known limit:** if this module's chunk has never loaded in the page session, nothing
   is listening and the event is genuinely lost. That is not fixable with event design —
   durable data belongs on a server. See the `cross-module-events` skill.
2. **Treat `event.detail` as untrusted.** It crossed a module boundary from a separately
   deployed bundle that may be running an older contract. Validate before use; do not
   assume a field exists because the type says it does.
3. **The payload type is declared in `packages/shell/src/types.d.ts`**, under
   `WindowEventMap.addPrescription`. The local mirror is `AddPrescriptionEvent` in
   `src/types.ts`. **These two must agree.** They are not linked by the compiler — this
   package typechecks fine while disagreeing with the shell.
4. **Never build request/response on the event bus.** It is fire-and-forget. There is no
   sender guarantee, no ordering guarantee, and no acknowledgement.

Prescriptions also dispatches outward: `showNotification` (toast via the host's
`<Toaster />`) and `navigateToModule` (asks the host to change route). It does not import
`react-router-dom` — it cannot, because it must also run standalone.

See `.agents/skills/cross-module-events/` for the full contract and how to add an event.

---

## Standalone mode

```bash
pnpm dev   # http://localhost:3002
```

`src/index.tsx` is `import("./bootstrap")` and nothing else. `PrescriptionOrders.tsx`
imports `./index.css` itself, because the host never runs `bootstrap.tsx`.

Standalone, nothing dispatches `addPrescription`, so the list stays at its seeded mock
state. That is expected — verify the module renders and refill controls work, then verify
the event flow inside the shell.

---

## Local conventions

- **4-space indentation** in `src/*.tsx` (this package and `analytics` differ from
  `home`, `records`, and `shell`, which use 2). The `rspack.config.ts` uses 2 like every
  other config. Match the file you are in.
- **No `resolve.alias` in this package.** There is no `@`, `@components`, or `@lib`.
  Use relative imports (`./lib/utils`, `./types`). Adding an alias here without adding it
  to `tsconfig.json` will build but fail typecheck.
- Mock data and types (`PrescriptionItem`, `AddPrescriptionEvent`) live in `src/types.ts`.
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
- Refill controls are quantity-bounded (`disabled={item.quantity <= 1}`). Keep the guard
  when adding similar controls, and keep `aria-label` on every icon-only button.

---

## Verify

```bash
cd ../.. && pnpm typecheck && pnpm test && pnpm build
```

If you touched the listener or the payload, run the full app (`pnpm dev` from the root)
and use the **in-app nav links**, not typed URLs — a full page load unloads every remote
and invalidates the test:

1. Visit `/prescriptions` first, so this chunk is loaded and listening.
2. Navigate to `/records` and add a prescription for a patient **not** in the seed data
   (`Sarah Chen` and `Lisa Nguyen` are seeded — using them gives a false pass).
3. Navigate back. The row is there, exactly once.
4. Repeat. Still exactly once — that is the duplicate-registration check.

---

## Skills in this package

- `.agents/skills/cross-module-events/` — typed CustomEvent contracts on `window`
