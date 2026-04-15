# Prescriptions — Remote Module

The prescriptions micro-frontend provides prescription orders management. It exposes `PrescriptionOrders` (instant render) and `StreamingPrescriptionOrders` (Suspense-wrapped with simulated delay). It listens for `addPrescription` events from the records module.

Runs on **localhost:3002**.

## Exposed Modules

```js
exposes: {
  "./PrescriptionOrders":          "./src/PrescriptionOrders.tsx",
  "./StreamingPrescriptionOrders": "./src/StreamingPrescriptionOrders.tsx",
}
```

## File Structure

```
prescriptions/
├── rspack.config.js           # MF remote — name: "prescriptions", port: 3002
├── postcss.config.js          # @tailwindcss/postcss
├── tsconfig.json
├── public/index.html          # Standalone dev page
└── src/
    ├── index.tsx              # Standalone bootstrap
    ├── PrescriptionOrders.tsx       # Full prescriptions management
    ├── PrescriptionOrders.test.tsx  # Prescriptions behavior tests
    ├── StreamingPrescriptionOrders.tsx # Resource + Suspense wrapper
    ├── index.css              # @theme tokens, animations
    ├── types.ts               # PrescriptionItem, events
    └── lib/
        └── utils.ts           # cn() utility
```

## Key Types

```typescript
interface PrescriptionItem {
  readonly id: number;
  readonly name: string;
  readonly price: number;
  readonly quantity: number;
}

interface AddPrescriptionEvent extends CustomEvent {
  detail: PrescriptionItem;
}
```

## Features

- **Table-like layout** — monospace column headers (Prescription, Qty, Total), bordered rows
- **Inline quantity controls** — connected `−` / count / `+` cells with border dividers
- **Order summary sidebar** — sticky panel with subtotal, shipping (free), tax, total in large serif italic
- **Citrine submit button** — `bg-citrine text-ink` with full-width emphasis
- **Empty state** — serif italic heading with a working "Browse Records →" CTA that requests host-owned navigation
- **Cross-module event listening** — adds items when `addPrescription` fires from records

## Event Handling

The prescriptions module registers an event listener on mount:

```typescript
useEffect(() => {
  const handleAddPrescription = (event: AddPrescriptionEvent) => {
    const prescriptionItem = event.detail;
    setPrescriptionItems((prev) => {
      const existing = prev.find((item) => item.id === prescriptionItem.id);
      if (existing) {
        return prev.map((item) =>
          item.id === prescriptionItem.id
            ? { ...item, quantity: item.quantity + prescriptionItem.quantity }
            : item
        );
      }
      return [...prev, prescriptionItem];
    });
  };
  window.addEventListener("addPrescription", handleAddPrescription);
  return () => window.removeEventListener("addPrescription", handleAddPrescription);
}, []);
```

If the prescription already exists in the list, its quantity is incremented. Otherwise it's appended.

When the list becomes empty, the CTA dispatches a navigation request instead of trying to import the shell router directly:

```typescript
window.dispatchEvent(
  new CustomEvent("navigateToModule", {
    detail: { module: "records" },
  })
);
```

That keeps routing host-owned while still letting the remote drive the user back into the records view.

## Initial Mock Data

The prescriptions module starts with two pre-loaded items for demo purposes:

| Item | Price | Qty |
|------|-------|-----|
| Sarah Chen prescription | $2,499.99 | 1 |
| Lisa Nguyen prescription | $249.99 | 2 |

## Streaming Pattern

Same Resource pattern as other remotes — `getResource("prescriptions-initial", 3500)` delays 3.5 seconds for the shell's skeleton to display.

## Development

```bash
npm run dev    # Starts on :3002
npm run build  # Production build
npm run lint   # Lint prescriptions source through the workspace ESLint config
npm run typecheck
npm run test
```

## Testing

`PrescriptionOrders.test.tsx` covers initial rendering, quantity controls, item removal, order summary calculations, `addPrescription` event listener, submit notification, and the empty-state navigation request. The package also exposes `lint`, `typecheck`, and `test` scripts for isolated quality checks. Run from the repo root:

```bash
npm test
```
