import { describe, it, expect } from "@rstest/core";
import { renderHook, act } from "@testing-library/react";
import { useKillSwitch } from "./demo";

const MODULE_IDS = ["home", "records", "prescriptions", "analytics"] as const;

describe("useKillSwitch", () => {
  it("initializes all modules as not killed", () => {
    const { result } = renderHook(() => useKillSwitch(MODULE_IDS));
    for (const id of MODULE_IDS) {
      expect(result.current.killed[id]).toBe(false);
    }
  });

  it("toggles a single module", () => {
    const { result } = renderHook(() => useKillSwitch(MODULE_IDS));

    act(() => result.current.toggle("records"));
    expect(result.current.killed.records).toBe(true);
    expect(result.current.killed.prescriptions).toBe(false);

    act(() => result.current.toggle("records"));
    expect(result.current.killed.records).toBe(false);
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
    act(() => result.current.toggle("prescriptions"));

    expect(result.current.killed.prescriptions).toBe(false);
    expect(result.current.killed.records).toBe(true);
    expect(result.current.killed.analytics).toBe(true);
  });
});

