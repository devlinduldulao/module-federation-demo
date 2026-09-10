import { useCallback, useState } from "react";

// ---------------------------------------------------------------------------
// Kill-switch state — simulate a remote going down
// ---------------------------------------------------------------------------

export type KilledRemotes = Readonly<Record<string, boolean>>;

export function useKillSwitch(moduleIds: readonly string[]) {
  const [killed, setKilled] = useState<KilledRemotes>(() =>
    Object.fromEntries(moduleIds.map((id) => [id, false]))
  );

  const toggle = useCallback((id: string) => {
    setKilled((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const killAll = useCallback(() => {
    setKilled((prev) =>
      Object.fromEntries(Object.keys(prev).map((id) => [id, true]))
    );
  }, []);

  const restoreAll = useCallback(() => {
    setKilled((prev) =>
      Object.fromEntries(Object.keys(prev).map((id) => [id, false]))
    );
  }, []);

  return { killed, toggle, killAll, restoreAll } as const;
}

// ---------------------------------------------------------------------------
// Version registry — each remote reports a version
// ---------------------------------------------------------------------------

