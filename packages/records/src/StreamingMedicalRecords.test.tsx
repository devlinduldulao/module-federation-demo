import { describe, it, expect, rs, beforeEach, afterEach } from "@rstest/core";
import { render, screen, act } from "@testing-library/react";
import React, { Suspense } from "react";
import StreamingMedicalRecords, {
    __resetRecordsStreamingResourceCache,
} from "./StreamingMedicalRecords";

rs.mock("./index.css", () => ({}));
rs.mock("./lib/utils", () => ({
    cn: (...args: unknown[]) =>
        args
            .flat()
            .filter((a) => typeof a === "string" && a.length > 0)
            .join(" "),
}));
rs.mock("./lib/theme", () => ({
    useActiveTheme: () => ({ theme: "dark", label: "Dark" }),
}));

function Fallback() {
    return <div role="status">Records loading skeleton</div>;
}

describe("StreamingMedicalRecords", () => {
    beforeEach(() => {
        rs.useFakeTimers();
        __resetRecordsStreamingResourceCache();
    });

    afterEach(() => {
        rs.useRealTimers();
    });

    it("shows the Suspense fallback while the resource is pending", () => {
        render(
            <Suspense fallback={<Fallback />}>
                <StreamingMedicalRecords />
            </Suspense>
        );
        expect(screen.getByRole("status")).toBeInTheDocument();
        expect(screen.getByText("Records loading skeleton")).toBeInTheDocument();
    });

    it("does not render MedicalRecords content while pending", () => {
        render(
            <Suspense fallback={<Fallback />}>
                <StreamingMedicalRecords />
            </Suspense>
        );
        expect(screen.queryByText("Patient Files")).not.toBeInTheDocument();
    });

    it("renders MedicalRecords after the delay resolves", async () => {
        render(
            <Suspense fallback={<Fallback />}>
                <StreamingMedicalRecords />
            </Suspense>
        );

        // Advance past the 2500ms delay and flush all promises
        await act(async () => {
            await rs.runAllTimersAsync();
        });

        expect(screen.getByText("Records")).toBeInTheDocument();
        expect(screen.getByText("Patient Files")).toBeInTheDocument();
    });

    it("replaces the skeleton with MedicalRecords content after resolution", async () => {
        render(
            <Suspense fallback={<Fallback />}>
                <StreamingMedicalRecords />
            </Suspense>
        );

        expect(screen.getByText("Records loading skeleton")).toBeInTheDocument();

        await act(async () => {
            await rs.runAllTimersAsync();
        });

        expect(screen.queryByText("Records loading skeleton")).not.toBeInTheDocument();
        expect(screen.getByText("Records")).toBeInTheDocument();
    });

    it("reuses cached resource — a second render suspends immediately without resetting", () => {
        // First render populates the cache
        const { unmount } = render(
            <Suspense fallback={<Fallback />}>
                <StreamingMedicalRecords />
            </Suspense>
        );
        unmount();

        // Second render uses the existing (still-pending) resource from cache
        render(
            <Suspense fallback={<div>Second skeleton</div>}>
                <StreamingMedicalRecords />
            </Suspense>
        );
        expect(screen.getByText("Second skeleton")).toBeInTheDocument();
    });
});
