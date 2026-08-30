import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useCounterStore, COUNTER_SOURCE } from "../lib/counter-store";

// Server state, also owned locally. Each package builds its own QueryClient, so
// each fetches /todos itself — visible as separate requests in the network tab.
// That duplication is the price of zero coupling; sharing one client would remove
// it and add a version lock in exchange.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
  },
});

interface Todo {
  readonly id: number;
}

async function fetchTodos(): Promise<readonly Todo[]> {
  const response = await fetch("https://jsonplaceholder.typicode.com/todos");
  if (!response.ok) throw new Error(`todos request failed: ${response.status}`);
  return response.json() as Promise<readonly Todo[]>;
}

function TodoCount() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["todos"],
    queryFn: fetchTodos,
  });

  const label = isError ? "error" : isPending ? "…" : String(data?.length ?? 0);

  return (
    <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
      Todos <span className="text-foreground">{label}</span>
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
        <TodoCount />
      </div>
    </QueryClientProvider>
  );
}
