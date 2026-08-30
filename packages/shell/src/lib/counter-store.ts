import { create } from "zustand";

// Client state, owned locally. This store is NOT shared across the federation —
// every package builds its own zustand instance, so nobody version-locks anybody.
// Cross-remote agreement happens on the `counterChange` event contract instead,
// which means a Vue remote could join using the same contract and no npm package.

const STORAGE_KEY = "mf-demo-counter";
export const COUNTER_SOURCE = "shell";

interface CounterState {
  count: number;
  lastSource: string;
  /** Local user action: update, persist, broadcast. */
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  /** Inbound from another module: update only — never re-broadcast, or we loop. */
  applyRemote: (count: number, source: string) => void;
}

function readInitial(): number {
  // Seeds a late-loading remote with the current value: a remote that mounts
  // after the header has counted up still starts in sync.
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function publish(count: number): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(count));
  } catch {
    // Storage can be unavailable; the event still syncs live listeners.
  }
  window.dispatchEvent(
    new CustomEvent("counterChange", {
      detail: { count, source: COUNTER_SOURCE },
    })
  );
}

export const useCounterStore = create<CounterState>((set, get) => ({
  count: readInitial(),
  lastSource: COUNTER_SOURCE,
  increment: () => {
    const count = get().count + 1;
    set({ count, lastSource: COUNTER_SOURCE });
    publish(count);
  },
  decrement: () => {
    const count = get().count - 1;
    set({ count, lastSource: COUNTER_SOURCE });
    publish(count);
  },
  reset: () => {
    set({ count: 0, lastSource: COUNTER_SOURCE });
    publish(0);
  },
  applyRemote: (count, source) => set({ count, lastSource: source }),
}));

// Module-scope listener, on purpose. If this lived in a useEffect the store would
// only track changes while the counter happened to be mounted, and a remounted
// remote would show a stale value.
if (typeof window !== "undefined") {
  window.addEventListener("counterChange", (event) => {
    const { count, source } = event.detail;
    if (source === COUNTER_SOURCE) return; // our own echo
    useCounterStore.getState().applyRemote(count, source);
  });
}
