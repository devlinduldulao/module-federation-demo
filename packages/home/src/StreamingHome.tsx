import Home from "./Home";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Resource<T> {
  read(): T;
}

// Suspense protocol: read() throws the promise while pending, throws on error,
// otherwise returns. Work starts at creation, not on read. Pre-`use()` idiom.
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

// Module scope on purpose — a resource built during render would throw a new
// promise every render and the fallback would never resolve.
const resourceCache = new Map<string, Resource<void>>();

// Test-only: lets the next test suspend again.
export function __resetHomeStreamingResourceCache(): void {
  resourceCache.clear();
}

// One Resource per key — the delay is paid once per page load, not per render.
function getResource(key: string, delayMs: number): Resource<void> {
  if (!resourceCache.has(key)) {
    resourceCache.set(key, createResource(() => delay(delayMs)));
  }
  return resourceCache.get(key)!;
}

const StreamingHome = () => {
  const resource = getResource("home-initial", 2000); // module-level cache
  resource.read(); // throws while pending → <Suspense> shows <HomeSkeleton />

  return <Home />;
};

export default StreamingHome;
