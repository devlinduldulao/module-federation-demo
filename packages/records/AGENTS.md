# AGENTS.md — `records` (remote)

Extends the root [`../../AGENTS.md`](../../AGENTS.md). Rules here win inside
`packages/records/`.

**Role:** remote. Port **3001**. Federation name `records`. Route `/records` in the shell.
Domain: patient medical records — lab results, imaging, consultations.

---

## Federation contract

```ts
exposes: {
  "./MedicalRecords":          "./src/MedicalRecords.tsx",
  "./StreamingMedicalRecords": "./src/StreamingMedicalRecords.tsx",
}
```

Consumed by the shell as `records/MedicalRecords` and `records/StreamingMedicalRecords`.
Both keys are public API. Changing `exposes` means editing three files: this config,
`packages/shell/src/types.d.ts`, and the root `rstest.config.ts` alias map.

---

## `records` is the `eager` module

The shell prefetches this remote on mount and imports **`records/MedicalRecords`** — the
plain, non-suspending variant. By the time the user clicks Records, the chunk is already
in cache and the module renders immediately.

That is the whole point of the strategy, so:

- **`MedicalRecords.tsx` must not suspend.** No `use()`, no resource `read()`, no
  blocking fetch. Anything that needs to suspend goes in `StreamingMedicalRecords.tsx`.
- Keep the module small enough for prefetching to be cheap — `performance.maxAssetSize`
  is 256000 here.

`StreamingMedicalRecords.tsx` is the reference implementation of the Resource + Suspense
pattern used across this repo. See `.agents/skills/streaming-suspense-remote/`.

---

## The streaming resource cache — and the test trap

```ts
const resourceCache = new Map<string, Resource<void>>();
export function __resetRecordsStreamingResourceCache(): void { resourceCache.clear(); }
```

The cache is **module-level, outside React**, so a re-render does not restart the 2500 ms
delay. That is deliberate: without it, every re-render would re-suspend and the skeleton
would flicker forever.

It also means the delay only happens **once per page load**. In tests, the second test in
a file will not suspend unless you call `__resetRecordsStreamingResourceCache()` in
`beforeEach`. The reset export exists solely for that; it is not application API.

---

## Cross-module events: records is a producer

Records **sends** work to Prescriptions. It never imports it.

```ts
window.dispatchEvent(new CustomEvent("addPrescription", {
  detail: { id, patientName, provider, quantity }, bubbles: true,
}));
window.dispatchEvent(new CustomEvent("showNotification", {
  detail: { type: "success", message: "..." },
}));
```

The `detail` shape is declared once in `packages/shell/src/types.d.ts` under
`WindowEventMap`. **Changing the payload here without changing that declaration breaks
`prescriptions` silently** — the listener will read `undefined` fields at runtime while
`pnpm typecheck` stays green in this package.

`addPrescription` is a fire-and-forget message. There is no acknowledgement, no retry,
and no guarantee a listener exists (Prescriptions may not be mounted). Do not build
request/response flows on top of it.

---

## Standalone mode

```bash
pnpm dev   # http://localhost:3001
```

`src/index.tsx` is `import("./bootstrap")` and nothing else — the required async
boundary. `MedicalRecords.tsx` imports `./index.css` itself, because the host never runs
`bootstrap.tsx`.

Standalone, `window.__MF_THEME__` is undefined and `useActiveTheme()` falls back to
`localStorage` then `"dark"`. Dispatched events go nowhere, which is correct — the module
still works, it just has no one listening.

---

## Local conventions

- 2-space indentation.
- `resolve.alias` provides `@`, `@components`, `@lib`.
- Mock data (`MOCK_RECORDS`) is `readonly` and `as const`. Keep new fixtures in the same
  shape; the types in `src/types.ts` (`MedicalRecord`, `PrescriptionItem`,
  `RecordCategory`) are derived from real usage.
- `cn()` from `./lib/utils` is the only class-merging helper.
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
- Record status drives colour (`critical` → `rose`, `reviewed` → `mint`). Keep status a
  finite union, never a free string.

---

## Verify

```bash
cd ../.. && pnpm typecheck && pnpm test && pnpm build
```

If you touched the streaming wrapper or the event payload, also run the app
(`pnpm dev` from the root) and confirm: the Records skeleton appears once, and clicking
"add to prescriptions" lands a row in the Prescriptions module.

---

## Skills in this package

- `.agents/skills/streaming-suspense-remote/` — the Resource + Suspense pattern
