import ShoppingCart from "./ShoppingCart";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Resource-based Suspense pattern (React 18+)
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

function getResource(key: string, delayMs: number): Resource<void> {
  if (!resourceCache.has(key)) {
    resourceCache.set(key, createResource(() => delay(delayMs)));
  }
  return resourceCache.get(key)!;
}

// ---------------------------------------------------------------------------
// Streaming wrapper - triggers Suspense, then renders the standalone cart.
// The host shell wraps this in <Suspense fallback={<CartSkeleton />}>.
// ---------------------------------------------------------------------------

const StreamingShoppingCart = () => {
  const resource = getResource("cart-initial", 3500);
  resource.read();
  return <ShoppingCart />;
};

export default StreamingShoppingCart;
