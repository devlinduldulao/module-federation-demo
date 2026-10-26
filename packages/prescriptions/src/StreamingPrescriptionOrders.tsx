import { use } from "react";
import PrescriptionOrders from "./PrescriptionOrders";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Module scope on purpose. use() needs the *same* promise on every render; one
// created during render would be new each time and the fallback would never
// resolve. React tracks settlement on the promise object itself, so caching the
// promise is the whole protocol — no hand-rolled status/read() wrapper needed.
const pendingDelays = new Map<string, Promise<void>>();

// Test-only: lets the next test suspend again.
export function __resetPrescriptionsStreamingResourceCache(): void {
    pendingDelays.clear();
}

// One promise per key — the delay is paid once per page load, not per render.
function getDelay(key: string, delayMs: number): Promise<void> {
    let promise = pendingDelays.get(key);
    if (!promise) {
        promise = delay(delayMs);
        pendingDelays.set(key, promise);
    }
    return promise;
}

const StreamingPrescriptionOrders = () => {
    use(getDelay("prescriptions-initial", 2500)); // suspends while pending → <Suspense> shows <PrescriptionsSkeleton />

    return <PrescriptionOrders />;
};

export default StreamingPrescriptionOrders;