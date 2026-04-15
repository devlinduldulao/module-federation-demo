import { useCallback, useMemo, useState } from "react";

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

export interface RemoteVersionInfo {
  readonly id: string;
  readonly version: string;
  readonly variant: "stable" | "canary";
  readonly buildHash: string;
}

const MOCK_VERSIONS: Record<string, RemoteVersionInfo> = {
  home: { id: "home", version: "1.0.0", variant: "stable", buildHash: "a3f2c1d" },
  records: { id: "records", version: "2.1.0", variant: "stable", buildHash: "b7e4f9a" },
  prescriptions: { id: "prescriptions", version: "1.3.2", variant: "stable", buildHash: "c1d8e3b" },
  analytics: { id: "analytics", version: "1.5.0", variant: "stable", buildHash: "d9f2a7c" },
};

const CANARY_VERSIONS: Record<string, RemoteVersionInfo> = {
  home: { id: "home", version: "1.1.0-canary.3", variant: "canary", buildHash: "e4a1b2c" },
  records: { id: "records", version: "2.2.0-canary.1", variant: "canary", buildHash: "f8d3c5e" },
  prescriptions: { id: "prescriptions", version: "1.4.0-canary.2", variant: "canary", buildHash: "a2b9d4f" },
  analytics: { id: "analytics", version: "1.6.0-canary.1", variant: "canary", buildHash: "b5c8e1a" },
};

export type DeploymentVariant = "stable" | "canary";

export function useVersionRegistry(moduleIds: readonly string[]) {
  const [variant, setVariant] = useState<DeploymentVariant>("stable");

  const versions = useMemo<readonly RemoteVersionInfo[]>(() => {
    const registry = variant === "stable" ? MOCK_VERSIONS : CANARY_VERSIONS;
    return moduleIds.map((id) => registry[id]!);
  }, [moduleIds, variant]);

  const toggleVariant = useCallback(() => {
    setVariant((prev) => (prev === "stable" ? "canary" : "stable"));
  }, []);

  return { variant, versions, toggleVariant, setVariant } as const;
}
