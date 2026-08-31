import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useCounterStore, COUNTER_SOURCE } from "../lib/counter-store";

// The host's own QueryClient, for the host's own server state.
//
// Note WHAT it fetches: the signed-in user, which is chrome the shell actually
// owns. It deliberately does NOT fetch /todos — that is a remote's domain data,
// and a host reaching for it would be the boundary violation this architecture
// exists to avoid. Each remote fetches its own.
//
// A real shell's server state looks like this: session, permissions, unread
// counts. Anything a remote owns, the remote fetches.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
  },
});

interface SignedInUser {
  readonly name: string;
}

async function fetchSignedInUser(): Promise<SignedInUser> {
  const response = await fetch("https://jsonplaceholder.typicode.com/users/1");
  if (!response.ok) throw new Error(`user request failed: ${response.status}`);
  return response.json() as Promise<SignedInUser>;
}

function SignedInUserBadge() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["signed-in-user"],
    queryFn: fetchSignedInUser,
  });

  const label = isError ? "error" : isPending ? "…" : (data?.name ?? "unknown");

  return (
    <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
      User <span className="text-foreground">{label}</span>
    </span>
  );
}

function CounterControls() {
  const count = useCounterStore((state) => state.count);
  const lastSource = useCounterStore((state) => state.lastSource);
  const increment = useCounterStore((state) => state.increment);
  const decrement = useCounterStore((state) => state.decrement);

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
        Count
      </span>
      <div className="inline-flex items-center border border-border rounded-md">
        <button
          type="button"
          onClick={decrement}
          className="w-7 h-7 font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors rounded-l-md"
          aria-label="Decrement shared counter"
        >
          −
        </button>
        <span
          className="w-9 h-7 flex items-center justify-center font-mono text-xs text-foreground border-x border-border"
          aria-label="Shared counter value"
        >
          {count}
        </span>
        <button
          type="button"
          onClick={increment}
          className="w-7 h-7 font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors rounded-r-md"
          aria-label="Increment shared counter"
        >
          +
        </button>
      </div>
      <span className="font-mono text-[10px] text-muted-foreground/70">
        via {lastSource === COUNTER_SOURCE ? "self" : lastSource}
      </span>
    </div>
  );
}

/** Client state + server state, both scoped to this module. */
export default function SharedStateBar() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <CounterControls />
        <SignedInUserBadge />
      </div>
    </QueryClientProvider>
  );
}
