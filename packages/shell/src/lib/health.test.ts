import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useRemoteHealth } from "./health";

const REMOTES = [
    { id: "records", port: "3001" },
    { id: "prescriptions", port: "3002" },
] as const;

describe("useRemoteHealth", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it("initializes all remotes with status checking", () => {
        vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => { /* never resolves */ })));
        const { result } = renderHook(() => useRemoteHealth(REMOTES));
        expect(result.current[0]!.status).toBe("checking");
        expect(result.current[1]!.status).toBe("checking");
    });

    it("initializes each remote with its correct id and port", () => {
        vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
        const { result } = renderHook(() => useRemoteHealth(REMOTES));
        expect(result.current[0]!.id).toBe("records");
        expect(result.current[0]!.port).toBe("3001");
        expect(result.current[1]!.id).toBe("prescriptions");
        expect(result.current[1]!.port).toBe("3002");
    });

    it("initializes with null latencyMs and lastChecked", () => {
        vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
        const { result } = renderHook(() => useRemoteHealth(REMOTES));
        expect(result.current[0]!.latencyMs).toBeNull();
        expect(result.current[0]!.lastChecked).toBeNull();
    });

    it("sets status to online when fetch returns an opaque response", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({ ok: false, type: "opaque" })
        );
        const { result } = renderHook(() => useRemoteHealth(REMOTES));

        await waitFor(() => {
            expect(result.current[0]!.status).toBe("online");
        });
        expect(result.current[1]!.status).toBe("online");
    });

    it("sets status to online when fetch returns ok: true", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({ ok: true, type: "basic" })
        );
        const { result } = renderHook(() => useRemoteHealth(REMOTES));

        await waitFor(() => {
            expect(result.current[0]!.status).toBe("online");
        });
    });

    it("sets status to offline when fetch throws a network error", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockRejectedValue(new Error("Network error"))
        );
        const { result } = renderHook(() => useRemoteHealth(REMOTES));

        await waitFor(() => {
            expect(result.current[0]!.status).toBe("offline");
        });
        expect(result.current[1]!.status).toBe("offline");
    });

    it("populates latencyMs as a non-negative number after check", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({ ok: true, type: "basic" })
        );
        const { result } = renderHook(() => useRemoteHealth(REMOTES));

        await waitFor(() => {
            expect(result.current[0]!.latencyMs).not.toBeNull();
        });
        expect(result.current[0]!.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it("populates lastChecked as a timestamp after check", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({ ok: true, type: "basic" })
        );
        const before = Date.now();
        const { result } = renderHook(() => useRemoteHealth(REMOTES));

        await waitFor(() => {
            expect(result.current[0]!.lastChecked).not.toBeNull();
        });
        expect(result.current[0]!.lastChecked).toBeGreaterThanOrEqual(before);
    });

    it("does not call fetch when enabled is false", async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);

        renderHook(() => useRemoteHealth(REMOTES, false));

        // Allow any microtasks to flush
        await act(async () => {
            await Promise.resolve();
        });

        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("calls fetch for each remote on mount", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValue({ ok: true, type: "basic" });
        vi.stubGlobal("fetch", fetchMock);

        renderHook(() => useRemoteHealth(REMOTES));

        await waitFor(() => {
            // 2 remotes × 1 initial run
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });
    });

    it("re-checks all remotes after the polling interval elapses", async () => {
        vi.useFakeTimers();
        const fetchMock = vi
            .fn()
            .mockResolvedValue({ ok: true, type: "basic" });
        vi.stubGlobal("fetch", fetchMock);

        renderHook(() => useRemoteHealth(REMOTES));

        // Flush the initial async runChecks() call (no timers involved — uses Promises)
        await act(async () => {
            await vi.advanceTimersByTimeAsync(0);
        });

        const callsAfterInitial = fetchMock.mock.calls.length;
        expect(callsAfterInitial).toBeGreaterThanOrEqual(REMOTES.length);

        // Advance by one interval tick (5000ms) and flush the resulting async work
        await act(async () => {
            await vi.advanceTimersByTimeAsync(5001);
        });

        expect(fetchMock.mock.calls.length).toBeGreaterThan(callsAfterInitial);

        vi.useRealTimers();
    });

    it("builds the correct health-check URL for each remote", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValue({ ok: true, type: "basic" });
        vi.stubGlobal("fetch", fetchMock);

        renderHook(() => useRemoteHealth([{ id: "records", port: "3001" }]));

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(
                "http://localhost:3001/remoteEntry.js",
                expect.objectContaining({ method: "HEAD", mode: "no-cors" })
            );
        });
    });
});
