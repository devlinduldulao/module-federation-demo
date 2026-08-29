---
name: streaming-suspense-remote
description: Build or modify a Streaming* wrapper that suspends behind a React Suspense boundary in a federated remote. Use when adding a streamed module, changing a Suspense delay, fixing a skeleton that flashes on every render, or fixing a test that will not suspend.
---

# Streaming Suspense in a Remote

`StreamingMedicalRecords.tsx` in this package is the reference implementation. Every
remote follows the same shape. Read it before writing a new one.

**This is client-side Suspense, not streaming SSR.** There is no server rendering
anywhere in this repo. The "streaming" name describes the user-visible behaviour —
skeleton first, content second.

## The pattern

```tsx
import MedicalRecords from "./MedicalRecords";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Resource<T> { read(): T; }

function createResource<T>(asyncFn: () => Promise<T>): Resource<T> {
  let status: "pending" | "success" | "error" = "pending";
  let result: T;
  const suspender = asyncFn().then(
    (data)  => { status = "success"; result = data; },
    (error) => { status = "error";   result = error; }
  );

  return {
    read() {
      if (status === "pending") throw suspender;   // ← Suspense catches the promise
      if (status === "error")   throw result;      // ← ErrorBoundary catches the error
      return result;
    },
  };
}

const resourceCache = new Map<string, Resource<void>>();

export function __resetRecordsStreamingResourceCache(): void {
  resourceCache.clear();
}

function getResource(key: string, delayMs: number): Resource<void> {
  if (!resourceCache.has(key)) {
    resourceCache.set(key, createResource(() => delay(delayMs)));
  }
  return resourceCache.get(key)!;
}

const StreamingMedicalRecords = () => {
  const resource = getResource("records-initial", 2500);
  resource.read();
  return <MedicalRecords />;
};

export default StreamingMedicalRecords;
```

## The three things that make it work

### 1. `read()` throws — that is the mechanism, not a bug

Throwing a **promise** is how a component tells React "I am not ready." React catches it,
renders the nearest `<Suspense fallback>`, and retries when the promise settles.
Throwing an **error** falls through to the nearest `<ErrorBoundary>`. Both boundaries are
supplied by the shell, per module.

### 2. The cache lives outside React

`resourceCache` is a module-level `Map`. This is the single most important line in the
file.

- Inside a component or a `useState`, the resource would be recreated on every render,
  `read()` would throw a fresh promise every time, and the skeleton would flicker
  forever — a render loop.
- Outside React, the delay runs **once per page load**. Re-renders read the cached
  `success` state and return immediately.

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

The module-level cache is global to the test file. **The second test will not suspend**
unless you clear it:

```tsx
import { __resetRecordsStreamingResourceCache } from "./StreamingMedicalRecords";

beforeEach(() => {
  __resetRecordsStreamingResourceCache();
});
```

That export exists **only** for tests. It is not application API — do not call it from
component code.

To assert the suspended state, render inside a `<Suspense>` with a recognizable fallback
and assert the fallback is present before advancing timers. Use `rs.useFakeTimers()`
rather than waiting 2500 ms of real time.

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
- For real data fetching. This is a timer wrapping `Promise`. A production data layer
  should expose a cached promise read with React 19's `use()`, not a hand-rolled
  `createResource`.
