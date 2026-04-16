# Records — Remote Module

The records micro-frontend provides a filterable medical records viewer. It exposes two components via Module Federation: `MedicalRecords` (renders immediately) and `StreamingMedicalRecords` (wraps the catalog in a Resource-based Suspense delay to simulate a slow API).

Runs on **localhost:3001**.

## Exposed Modules

```js
exposes: {
  "./MedicalRecords":          "./src/MedicalRecords.tsx",
  "./StreamingMedicalRecords": "./src/StreamingMedicalRecords.tsx",
}
```

The shell imports `MedicalRecords` directly (the eager loading strategy) — the chunk is preloaded on shell mount so it's cached before the user navigates to Records.

Because the shell imports `MedicalRecords` directly, `MedicalRecords.tsx` is also where the module's stylesheet must be imported. `bootstrap.tsx` is standalone-only and cannot be the only place that loads `index.css`.

## File Structure

```
records/
├── rspack.config.js           # MF remote — name: "records", port: 3001
├── postcss.config.js          # @tailwindcss/postcss
├── tsconfig.json
├── public/index.html          # Standalone dev page
└── src/
    ├── index.tsx              # Standalone bootstrap (renders MedicalRecords)
    ├── MedicalRecords.tsx    # Full catalog with filters + grid, imports index.css
    ├── MedicalRecords.test.tsx # Medical records tests
    ├── StreamingMedicalRecords.tsx # Resource + Suspense wrapper
    ├── index.css              # @theme tokens, animations
    ├── types.ts               # MedicalRecord, PrescriptionItem, RecordCategory, events
    └── lib/
        └── utils.ts           # cn() utility
```

## Key Types

```typescript
interface MedicalRecord {
  readonly id: number;
  readonly name: string;
  readonly price: number;
  readonly image?: string;
  readonly category: string;
  readonly description: string;
}

type RecordCategory = "all" | "lab-results" | "imaging" | "clinical-notes";
```

## Features

- **Category filter bar** — monospace uppercase tabs with citrine underline on active
- **1px editorial grid** — `gap-[1px] bg-edge` creates sharp dividing lines between cards
- **Record cards** — aspect-square image placeholder, serif italic name, mono price, "Add →" button
- **Citrine hover line** — 2px bar scales in from left on card image hover
- **Staggered animations** — each card fades in with incremental delay
- **Add prescription** — dispatches `addPrescription` CustomEvent + `showNotification` for the shell toast

## Inter-Module Communication

When a user clicks "Add →", the component dispatches:

```typescript
window.dispatchEvent(new CustomEvent("addPrescription", {
  detail: { id: record.id, name: record.name, price: record.price, quantity: 1 },
  bubbles: true,
}));

window.dispatchEvent(new CustomEvent("showNotification", {
  detail: { type: "success", message: `${record.name} prescription created` },
}));
```

The prescriptions module listens for `addPrescription`. The shell listens for `showNotification`.

## Streaming Pattern

`StreamingMedicalRecords` uses the Resource pattern:

```typescript
const StreamingMedicalRecords = () => {
  const resource = getResource("records-initial", 2500); // 2.5s simulated delay
  resource.read(); // Throws a Promise for Suspense if pending
  return <MedicalRecords />;
};
```

The shell's `<Suspense fallback={<RecordsSkeleton />}>` catches the thrown promise and shows the skeleton until the resource resolves.

## Development

```bash
npm run dev    # Starts on :3001
npm run build  # Production build
npm run lint   # Lint records source through the workspace ESLint config
npm run typecheck
npm run test
```

Visit `http://localhost:3001` to see the records viewer standalone. The shell at `:3000` loads this module's `remoteEntry.js` automatically.

When changing styles, keep CSS ownership with the exposed component. If `index.css` is imported only from `bootstrap.tsx`, the standalone app still looks right while the federated shell render loses remote utility styles.

## Testing

`MedicalRecords.test.tsx` covers records grid rendering, category filtering, add-to-prescriptions event dispatch, notification events, and accessibility roles. The package also exposes `lint`, `typecheck`, and `test` scripts for isolated quality checks. Run from the repo root:

```bash
npm test
```
