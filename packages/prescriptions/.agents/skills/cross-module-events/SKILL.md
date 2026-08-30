---
name: cross-module-events
description: Add, change, or debug communication between federated modules using typed CustomEvents on window. Use when one micro-frontend needs to notify another, when adding an event payload, or when an event fires twice, fires zero times, or has undefined fields.
---

# Cross-Module Events

Federated modules in this repo do **not** import each other. They communicate by
dispatching typed `CustomEvent`s on `window`. This skill lives in `prescriptions`
because it is the only module that both listens and dispatches.

## Why events and not a shared store

A shared store would be a shared runtime dependency — every module would have to agree on
its version, and updating it would mean redeploying all five apps together. That is
exactly the coupling micro-frontends exist to avoid.

`window` is already there, in every module, with no version. The cost is that the
contract is **not compiler-enforced across the boundary**. You maintain it by hand.

## The event catalogue

All payloads are declared in **one place**: `packages/shell/src/types.d.ts`, in the
`WindowEventMap` interface. That is the contract.

| Event | Dispatched by | Consumed by | Payload |
|---|---|---|---|
| `addPrescription` | records | **prescriptions** | `{ id, patientName, provider, quantity }` |
| `showNotification` | any module | shell (`<Toaster />`) | `{ type: "success" \| "error" \| "info" \| "warning", message }` |
| `navigateToModule` | home, prescriptions | shell (router) | `{ module: "home" \| "records" \| "prescriptions" \| "analytics" }` |
| `moduleChange` | shell | any module | `{ newModule: ... }` |
| `themeChange` | shell | all remotes | `{ theme, colorScheme }` |
| `counterChange` | any module | every other module | `{ count, source }` |

`counterChange` is the client-state channel. **Every package owns its own zustand store**
(`src/lib/counter-store.ts`) and they agree only on this payload — there is no shared
store and no shared npm package, so no team version-locks another and a non-React remote
could join using the same contract. Two rules specific to it:

- **Ignore your own echo.** `window` events fire on the dispatcher too, so the listener
  bails when `source === COUNTER_SOURCE`. Without that guard you re-broadcast and loop.
- **The listener is registered at module scope, not in a `useEffect`.** A remote that only
  listened while mounted would show a stale count after remounting.

Late-loading remotes are seeded from `localStorage` (`mf-demo-counter`), because a remote
that was not loaded yet never heard the earlier events. Note that this is per-origin, so a
remote running standalone on its own port starts from its own count — correct, not a bug.

Note the direction of the last two: the shell broadcasts, remotes listen. Remotes never
set the theme and never route directly — they **ask**.

## Listening (the consumer side)

```tsx
useEffect(() => {
  const handleAddPrescription = (event: WindowEventMap["addPrescription"]) => {
    const { id, patientName, provider, quantity } = event.detail;
    setItems((prev) => /* ... */);
  };

  window.addEventListener("addPrescription", handleAddPrescription);
  return () => window.removeEventListener("addPrescription", handleAddPrescription);
}, []);
```

### Four rules, in order of how often they are broken

1. **Always remove the listener in the cleanup.** A remote unmounts and remounts every
   time the user navigates away and back. A leaked listener means the next event is
   handled twice, then three times. This is the number one bug in this pattern, and it
   looks like "the row got added twice" rather than like a leak.

2. **Type the handler parameter as `WindowEventMap["<name>"]`.** Do not use
   `CustomEvent<any>` or cast. The `WindowEventMap` augmentation in the shell's
   `types.d.ts` is what makes `event.detail` typed at all.

3. **Treat `event.detail` as untrusted input.** It crossed a boundary from a separately
   deployed bundle that may be running an older version of the contract. The type is a
   promise about a build that is not the build you are looking at. Validate before use.

4. **Keep the handler idempotent where you can.** There is no delivery guarantee and no
   deduplication. If the same event arrives twice, prefer a handler that converges rather
   than one that appends blindly.

## Dispatching (the producer side)

```ts
window.dispatchEvent(
  new CustomEvent("showNotification", {
    detail: { type: "success", message: "Prescription submitted for review" },
  })
);
```

- **Fire and forget.** No acknowledgement, no return value, no retry. Do not build
  request/response flows on top of this. If you need a response, you need a different
  mechanism than this demo has.
- **No listener may exist.** The target module may not be mounted, or may not be
  deployed at all. Dispatching into the void must be harmless.
- `bubbles: true` appears on `addPrescription` in `records`. On `window` it makes no
  practical difference; it is harmless and consistent with the existing code.

## Adding a new event

Four steps, all required:

1. **Declare the payload** in `packages/shell/src/types.d.ts`:

   ```ts
   interface WindowEventMap {
     refillApproved: CustomEvent<{ prescriptionId: number; approvedBy: string }>;
   }
   ```

2. **Mirror the type locally** if the module needs it in its own signatures — this
   package keeps `AddPrescriptionEvent` in `src/types.ts` for that purpose. **The mirror
   and the declaration are not linked by the compiler.** They must be updated together;
   a mismatch typechecks green in both packages and fails at runtime.

3. **Dispatch** from the producer, **listen** in the consumer with a cleanup.

4. **Document it** in the table above and in the consuming package's `AGENTS.md`.

## Debugging

**Event fires twice (or N times)** — a listener was not removed. Check every `useEffect`
that registers one has a cleanup, and that the dependency array is not causing
re-registration on each render.

**Event never fires** — verify with a temporary listener at the top level:

```js
window.addEventListener("addPrescription", (e) => console.log("SAW", e.detail));
```

If that logs and your component's handler does not, the component was unmounted, or its
listener was registered after the dispatch.

**`event.detail` fields are `undefined`** — the producer and consumer disagree on the
payload shape. This is the classic contract drift. Compare the dispatch site, the
`WindowEventMap` declaration, and any local mirror type. In a real deployment this
happens when one module ships a payload change and the other has not been redeployed.

**Nothing works in standalone mode** — expected. On `:3002` alone, no other module is
running to dispatch or receive. Test event flows inside the shell.

## Verify

```bash
cd ../.. && pnpm typecheck && pnpm test && pnpm build
pnpm dev
```

Then, in the browser: go to Records, add a prescription, confirm the toast appears, go to
Prescriptions, confirm **exactly one** row was added. Navigate away and back and repeat —
still exactly one. That round trip is the real test of both the contract and the cleanup.
