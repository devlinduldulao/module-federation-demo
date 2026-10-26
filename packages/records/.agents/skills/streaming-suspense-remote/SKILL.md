---
name: streaming-suspense-remote
description: Build or modify a Streaming* wrapper that suspends behind a React Suspense boundary in a federated remote using React 19's use(). Use when adding a streamed module, changing a Suspense delay, fixing a skeleton that flashes on every render, or fixing a test that will not suspend or never resolves.
---

# Streaming Suspense in a Remote

`StreamingMedicalRecords.tsx` in this package is the reference implementation. Every
remote follows the same shape. Read it before writing a new one.

**This is client-side Suspense, not streaming SSR.** There is no server rendering
anywhere in this repo. The "streaming" name describes the user-visible behaviour —
skeleton first, content second.

## The pattern

```tsx
import { use } from "react";
import MedicalRecords from "./MedicalRecords";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const pendingDelays = new Map<string, Promise<void>>();

export function __resetRecordsStreamingResourceCache(): void {
  pendingDelays.clear();
}

function getDelay(key: string, delayMs: number): Promise<void> {
  let promise = pendingDelays.get(key);
  if (!promise) {
    promise = delay(delayMs);
    pendingDelays.set(key, promise);
  }
  return promise;
}

const StreamingMedicalRecords = () => {
  use(getDelay("records-initial", 2500));   // ← suspends while pending
  return <MedicalRecords />;
};

export default StreamingMedicalRecords;
```

## The three things that make it work

### 1. `use()` is the mechanism

`use(promise)` is React 19's first-class way for a component to say "I am not ready."
While the promise is pending React renders the nearest `<Suspense fallback>` and retries
when it settles. If the promise **rejects**, `use()` rethrows the reason and the nearest
`<ErrorBoundary>` catches it. Both boundaries are supplied by the shell, per module.

React tracks settlement by attaching `status` / `value` / `reason` to the promise object
itself. That is why there is no hand-rolled `createResource` with a `read()` that throws:
the promise *is* the resource. Before `use()` existed this file threw the promise
manually — that pre-19 idiom still works but is deprecated and should not come back.

### 2. The cache lives outside React

`pendingDelays` is a module-level `Map`. This is the single most important line in the
file.

- `use()` must receive the **same promise object** on every render. A promise created
  inside the component — or in `useState`, or in `useMemo` — is new each render, so every
  render re-suspends and the skeleton flickers forever. React logs *"A component was
  suspended by an uncached promise"* when this happens.
- Outside React, the delay runs **once per page load**. Re-renders hand `use()` an
  already-fulfilled promise and it returns synchronously.

**Never move the cache into the component.** Never key it on something that changes per
render.

### 3. The wrapper is thin

`StreamingMedicalRecords` suspends and then renders `<MedicalRecords />`. It holds no
state, no props, no logic. The plain component stays independently usable — that is what
lets the shell import `records/MedicalRecords` directly for the `eager` strategy while
importing `records/StreamingMedicalRecords` for the `streamed` one.

**Do not put business logic in the streaming wrapper.** It would only run on one of the
two paths.

## Adding a new streaming wrapper

1. Name it `Streaming<ComponentName>.tsx`, next to the component it wraps.
2. Export a reset function named `__reset<Package>StreamingResourceCache`. The existing
   names are `__resetHomeStreamingResourceCache`,
   `__resetRecordsStreamingResourceCache`, `__resetPrescriptionsStreamingResourceCache`,
   `__resetAnalyticsStreamingResourceCache`. Follow the convention exactly — the shell's
   `types.d.ts` declares these by name.
3. Add both to `exposes` in `rspack.config.ts`, `packages/shell/src/types.d.ts`, and the
   root `rstest.config.ts` alias map.
4. Add a matching skeleton in `packages/shell/src/components/`. A streamed module without
   a layout-matched skeleton feels broken, not fast.

## Testing a streaming component

Two traps, both of which make a test look like "it never suspends" or "it never resolves".

### Trap 1 — the cache is global to the test file

**The second test will not suspend** unless you clear it:

```tsx
import { __resetRecordsStreamingResourceCache } from "./StreamingMedicalRecords";

beforeEach(() => {
  __resetRecordsStreamingResourceCache();
});
```

That export exists **only** for tests. It is not application API — do not call it from
component code.

### Trap 2 — `use()` needs an awaited `act()`

`use()` yields to the microtask queue once before React commits a fallback, so the
promise has a chance to resolve synchronously. A **synchronous** `act()` — which is what
Testing Library's bare `render()`, `fireEvent`, and `userEvent` wrap things in — drops
that continuation. The fallback never commits, the root is stuck until some unrelated
update arrives, and React logs:

```
A component suspended inside an `act` scope, but the `act` call was not awaited.
```

The fix is to await the render, and to await the timer advance in a second `act`:

```tsx
async function renderStreaming(fallback: ReactNode = <Fallback />) {
  let view!: ReturnType<typeof render>;
  await act(async () => {
    view = render(
      <Suspense fallback={fallback}>
        <StreamingMedicalRecords />
      </Suspense>
    );
  });
  return view;
}

it("renders after the delay resolves", async () => {
  await renderStreaming();
  expect(screen.getByRole("status")).toBeInTheDocument();   // skeleton

  await act(async () => {
    await rs.runAllTimersAsync();
  });

  expect(screen.getByText("Patient Files")).toBeInTheDocument();
});
```

The same applies in the shell: `App.test.tsx` wraps any navigation to a streamed module
in `await act(async () => { fireEvent.click(...) })` for exactly this reason. This is
test-environment behaviour only — in the browser there is no `act` queue and `use()`
resumes normally.

Use `rs.useFakeTimers()` rather than waiting 2500 ms of real time.

## Choosing a delay

The delays in this repo (2500 ms for records) are **demonstration values**, chosen so a
skeleton is clearly visible. They are not modelling real latency.

If you change one, change the corresponding skeleton expectations too, and keep the
delays distinct across modules — identical delays make it impossible to tell in a running
app which module is loading.

## When NOT to use this pattern

- On an `instant` module (`home/Home`). It exists to render immediately.
- On the plain component imported by the `eager` strategy (`records/MedicalRecords`).
  Prefetching is pointless if the component then suspends anyway.
- For real data fetching with a timer. The delay here is a stand-in; a production data
  layer should hand `use()` a promise for real data, cached by the data layer (TanStack
  Query's `useSuspenseQuery`, a router loader, or a `cache()`d fetch) — the `use()` call
  and the module-level-cache rule are the same.