import { create } from "zustand";
import type { PrescriptionItem } from "../types";

// Domain state for this remote, owned locally like every other store here.
//
// The important part is WHERE the listener lives. `addPrescription` is fire and
// forget: Records dispatches it whether or not anybody is listening. Prescriptions
// is a `streamed` module, so its chunk is not even downloaded until the user first
// navigates here — and the component unmounts again the moment they navigate away.
//
// A listener inside a `useEffect` therefore only exists while the page is on screen,
// and every event fired outside that window is lost for good. Registering at module
// scope means we listen from the moment the chunk loads, and persisting to storage
// means a cold load still catches up on what it missed.
//
// This is the difference between "the event fired" and "the event was delivered".

const STORAGE_KEY = "mf-demo-prescriptions";

const SEED: readonly PrescriptionItem[] = [
  { id: 1, patientName: "Sarah Chen", provider: "Dr. Williams", quantity: 1 },
  { id: 7, patientName: "Lisa Nguyen", provider: "Dr. Patel", quantity: 2 },
];

interface PrescriptionsState {
  items: PrescriptionItem[];
  /** Inbound from Records, or from any module dispatching the same contract. */
  add: (item: PrescriptionItem) => void;
  updateQuantity: (id: number, delta: number) => void;
  remove: (id: number) => void;
  reset: () => void;
}

function readInitial(): PrescriptionItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...SEED];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PrescriptionItem[]) : [...SEED];
  } catch {
    return [...SEED];
  }
}

function persist(items: readonly PrescriptionItem[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage can be unavailable; in-memory state still works for this session.
  }
}

/** Merge on id so the same patient adds refills instead of duplicating a row. */
function mergeItem(
  items: readonly PrescriptionItem[],
  incoming: PrescriptionItem
): PrescriptionItem[] {
  const existing = items.find((item) => item.id === incoming.id);
  if (!existing) return [...items, incoming];
  return items.map((item) =>
    item.id === incoming.id
      ? { ...item, quantity: item.quantity + incoming.quantity }
      : item
  );
}

export const usePrescriptionsStore = create<PrescriptionsState>((set, get) => ({
  items: readInitial(),
  add: (item) => {
    const items = mergeItem(get().items, item);
    set({ items });
    persist(items);
  },
  updateQuantity: (id, delta) => {
    const items = get().items.map((item) =>
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    );
    set({ items });
    persist(items);
  },
  remove: (id) => {
    const items = get().items.filter((item) => item.id !== id);
    set({ items });
    persist(items);
  },
  reset: () => {
    const items = [...SEED];
    set({ items });
    persist(items);
  },
}));

/** Test-only: restores the seed so one test cannot leak into the next. */
export function __resetPrescriptionsStore(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  usePrescriptionsStore.setState({ items: [...SEED] });
}

// Module scope, not a useEffect. This is the whole point — see the note above.
if (typeof window !== "undefined") {
  window.addEventListener("addPrescription", (event) => {
    usePrescriptionsStore.getState().add(event.detail);
  });
}
