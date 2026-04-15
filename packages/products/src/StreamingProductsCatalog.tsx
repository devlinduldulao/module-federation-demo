import ProductsCatalog from "./ProductsCatalog";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Resource-based Suspense pattern (React 18+)
// ---------------------------------------------------------------------------
// When this module is loaded via Module Federation, `getResource` creates a
// promise that simulates a network delay.  Calling `resource.read()` inside
// the render path *throws* that promise, which React's <Suspense> boundary
// catches - displaying the shell's skeleton fallback until the delay resolves.
// ---------------------------------------------------------------------------

interface Resource<T> {
  read(): T;
}

function createResource<T>(asyncFn: () => Promise<T>): Resource<T> {
  let status: "pending" | "success" | "error" = "pending";
  let result: T;
  const suspender = asyncFn().then(
    (data) => {
      status = "success";
      result = data;
    },
    (error) => {
      status = "error";
      result = error;
    }
  );

  return {
    read() {
      if (status === "pending") throw suspender;
      if (status === "error") throw result;
      return result;
    },
  };
}

const resourceCache = new Map<string, Resource<void>>();

export function __resetProductsStreamingResourceCache(): void {
  resourceCache.clear();
}

function getResource(key: string, delayMs: number): Resource<void> {
  if (!resourceCache.has(key)) {
    resourceCache.set(key, createResource(() => delay(delayMs)));
  }
  return resourceCache.get(key)!;
}

// ---------------------------------------------------------------------------
// Streaming wrapper - the only job is to trigger Suspense, then render the
// standalone component.  The host shell wraps this in <Suspense fallback={...}>
// so the user sees a skeleton while the simulated fetch completes.
// ---------------------------------------------------------------------------

const StreamingProductsCatalog = () => {
  const resource = getResource("products-initial", 2500);
  resource.read(); // throws a Promise while pending -> triggers Suspense
  return <ProductsCatalog />;
};

export default StreamingProductsCatalog;
