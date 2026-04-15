import { useEffect, useRef, useState } from "react";

export type RemoteStatus = "online" | "offline" | "checking";

export interface RemoteHealth {
  readonly id: string;
  readonly port: string;
  readonly status: RemoteStatus;
  readonly lastChecked: number | null;
  readonly latencyMs: number | null;
}

const HEALTH_CHECK_INTERVAL = 5000;

function buildHealthUrl(port: string): string {
  return `http://localhost:${port}/remoteEntry.js`;
}

async function checkRemote(port: string): Promise<{ ok: boolean; latencyMs: number }> {
  const start = performance.now();
  try {
    const response = await fetch(buildHealthUrl(port), {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-store",
    });
    const latencyMs = Math.round(performance.now() - start);
    // no-cors gives opaque response (status 0) but it means the server responded
    return { ok: response.ok || response.type === "opaque", latencyMs };
  } catch {
    return { ok: false, latencyMs: Math.round(performance.now() - start) };
  }
}

export function useRemoteHealth(
  remotes: readonly { readonly id: string; readonly port: string }[],
  enabled: boolean = true
): readonly RemoteHealth[] {
  const [health, setHealth] = useState<readonly RemoteHealth[]>(() =>
    remotes.map((r) => ({
      id: r.id,
      port: r.port,
      status: "checking" as const,
      lastChecked: null,
      latencyMs: null,
    }))
  );

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const runChecks = async () => {
      const results = await Promise.all(
        remotes.map(async (remote) => {
          const result = await checkRemote(remote.port);
          return {
            id: remote.id,
            port: remote.port,
            status: result.ok ? ("online" as const) : ("offline" as const),
            lastChecked: Date.now(),
            latencyMs: result.latencyMs,
          };
        })
      );

      if (!cancelled && enabledRef.current) {
        setHealth(results);
      }
    };

    runChecks();
    const interval = setInterval(runChecks, HEALTH_CHECK_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [remotes, enabled]);

  return health;
}
