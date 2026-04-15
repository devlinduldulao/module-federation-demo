import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKillSwitch, useVersionRegistry } from "./demo";

const MODULE_IDS = ["home", "products", "cart", "dashboard"] as const;

describe("useKillSwitch", () => {
  it("initializes all modules as not killed", () => {
    const { result } = renderHook(() => useKillSwitch(MODULE_IDS));
    for (const id of MODULE_IDS) {
      expect(result.current.killed[id]).toBe(false);
    }
  });

  it("toggles a single module", () => {
    const { result } = renderHook(() => useKillSwitch(MODULE_IDS));

    act(() => result.current.toggle("products"));
    expect(result.current.killed.products).toBe(true);
    expect(result.current.killed.cart).toBe(false);

    act(() => result.current.toggle("products"));
    expect(result.current.killed.products).toBe(false);
  });

  it("kills all modules", () => {
    const { result } = renderHook(() => useKillSwitch(MODULE_IDS));

    act(() => result.current.killAll());
    for (const id of MODULE_IDS) {
      expect(result.current.killed[id]).toBe(true);
    }
  });

  it("restores all modules", () => {
    const { result } = renderHook(() => useKillSwitch(MODULE_IDS));

    act(() => result.current.killAll());
    act(() => result.current.restoreAll());
    for (const id of MODULE_IDS) {
      expect(result.current.killed[id]).toBe(false);
    }
  });

  it("kill all then toggle one off", () => {
    const { result } = renderHook(() => useKillSwitch(MODULE_IDS));

    act(() => result.current.killAll());
    act(() => result.current.toggle("cart"));

    expect(result.current.killed.cart).toBe(false);
    expect(result.current.killed.products).toBe(true);
    expect(result.current.killed.dashboard).toBe(true);
  });
});

describe("useVersionRegistry", () => {
  it("defaults to stable variant", () => {
    const { result } = renderHook(() => useVersionRegistry(MODULE_IDS));
    expect(result.current.variant).toBe("stable");
  });

  it("returns stable versions by default", () => {
    const { result } = renderHook(() => useVersionRegistry(MODULE_IDS));
    const versions = result.current.versions;

    expect(versions).toHaveLength(4);
    expect(versions[0]).toMatchObject({
      id: "home",
      version: "1.0.0",
      variant: "stable",
    });
    expect(versions[1]).toMatchObject({
      id: "products",
      version: "2.1.0",
      variant: "stable",
    });
  });

  it("toggles to canary variant", () => {
    const { result } = renderHook(() => useVersionRegistry(MODULE_IDS));

    act(() => result.current.toggleVariant());
    expect(result.current.variant).toBe("canary");

    const versions = result.current.versions;
    expect(versions[0]).toMatchObject({
      id: "home",
      variant: "canary",
    });
    expect(versions[1]).toMatchObject({
      id: "products",
      version: "2.2.0-canary.1",
      variant: "canary",
    });
  });

  it("toggles back to stable", () => {
    const { result } = renderHook(() => useVersionRegistry(MODULE_IDS));

    act(() => result.current.toggleVariant());
    act(() => result.current.toggleVariant());
    expect(result.current.variant).toBe("stable");
    expect(result.current.versions[0]!.variant).toBe("stable");
  });

  it("each version has a build hash", () => {
    const { result } = renderHook(() => useVersionRegistry(MODULE_IDS));
    for (const v of result.current.versions) {
      expect(v.buildHash).toBeTruthy();
      expect(v.buildHash.length).toBe(7);
    }
  });

  it("canary versions have different hashes from stable", () => {
    const { result } = renderHook(() => useVersionRegistry(MODULE_IDS));
    const stableHashes = result.current.versions.map((v) => v.buildHash);

    act(() => result.current.toggleVariant());
    const canaryHashes = result.current.versions.map((v) => v.buildHash);

    expect(stableHashes).not.toEqual(canaryHashes);
  });
});
