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
`packages/shell/src/types.d.ts` and the root `vitest.config.ts` alias map.

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

```ts
useEffect(() => {
  const handleAddPrescription = (event: WindowEventMap["addPrescription"]) => { ... };
  window.addEventListener("addPrescription", handleAddPrescription);
  return () => window.removeEventListener("addPrescription", handleAddPrescription);
}, []);
```

Rules that matter here more than anywhere else in the repo:

1. **Always remove the listener in the cleanup function.** A remote is unmounted and
   remounted every time the user navigates away and back. A leaked listener means one
   `addPrescription` event appends the row two, three, four times.
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
- Design tokens from `src/index.css`: `cream`, `citrine`, `stone`, `dim`, `edge`,
  `surface`, `elevated`, `mint`, `rose`. `font-display` italic for patient names,
  `font-mono` for counts and metadata.
- Refill controls are quantity-bounded (`disabled={item.quantity <= 1}`). Keep the guard
  when adding similar controls, and keep `aria-label` on every icon-only button.

---

## Verify

```bash
cd ../.. && pnpm typecheck && pnpm test && pnpm build
```

If you touched the listener or the payload, run the full app (`pnpm dev` from the root),
go to Records, add a prescription, then navigate to Prescriptions and confirm exactly one
row was added. Navigate away and back, repeat, and confirm it is still exactly one — that
is the listener-cleanup check.

---

## Skills in this package

- `.agents/skills/cross-module-events/` — typed CustomEvent contracts on `window`
