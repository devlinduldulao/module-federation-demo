import { useState, useEffect, useCallback, useMemo, memo } from "react";
import type { PrescriptionItem, AddPrescriptionEvent } from "./types";
import { useActiveTheme } from "./lib/theme";
import "./index.css";

// Prescription row
const PrescriptionRow = memo<{
    item: PrescriptionItem;
    index: number;
    onUpdateQuantity: (id: number, delta: number) => void;
    onRemove: (id: number) => void;
}>(({ item, index, onUpdateQuantity, onRemove }) => (
    <article
        className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 py-3.5 animate-fade-in-up"
        style={{ animationDelay: `${index * 80}ms` }}
        aria-label={`Prescription: ${item.patientName}`}
    >
        {/* Icon placeholder */}
        <div className="w-11 h-11 bg-muted shrink-0 flex items-center justify-center">
            <span className="font-mono text-[10px] text-muted-foreground/70">Rx</span>
        </div>

        {/* Patient info */}
        <div className="flex-1 min-w-0">
            <h3 className="font-sans font-semibold text-base text-foreground group-hover:text-primary transition-colors duration-200">
                {item.patientName}
            </h3>
            <span className="font-mono text-xs text-muted-foreground">
                {item.provider}
            </span>
        </div>

        {/* Refill controls */}
        <div className="flex items-center border border-border">
            <button
                onClick={() => onUpdateQuantity(item.id, -1)}
                disabled={item.quantity <= 1}
                className="w-8 h-8 flex items-center justify-center font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-card transition-colors duration-200 disabled:opacity-30"
                aria-label={`Decrease refills for ${item.patientName}`}
            >
                −
            </button>
            <span className="w-9 h-8 flex items-center justify-center font-mono text-xs text-foreground border-x border-border">
                {item.quantity}
            </span>
            <button
                onClick={() => onUpdateQuantity(item.id, 1)}
                className="w-8 h-8 flex items-center justify-center font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-card transition-colors duration-200"
                aria-label={`Increase refills for ${item.patientName}`}
            >
                +
            </button>
        </div>

        {/* Refill count */}
        <div className="w-24 text-right">
            <span className="font-mono text-sm text-foreground">
                {item.quantity} refill{item.quantity !== 1 ? "s" : ""}
            </span>
        </div>

        {/* Remove */}
        <button
            onClick={() => onRemove(item.id)}
            className="font-mono text-xs text-muted-foreground/70 hover:text-destructive transition-colors duration-200"
            aria-label={`Remove prescription for ${item.patientName}`}
        >
            &times;
        </button>
    </article>
));

PrescriptionRow.displayName = "PrescriptionRow";

// Empty state
const EmptyPrescriptions = memo<{ onBrowseRecords: () => void }>(({ onBrowseRecords }) => (
    <div className="text-center py-12 border border-border" role="region" aria-label="Empty prescriptions">
        <span className="font-mono text-xs text-muted-foreground/70 block mb-2">
            No active prescriptions
        </span>
        <h3 className="font-sans font-semibold text-lg text-foreground mb-2">
            Queue is empty
        </h3>
        <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto">
            Browse patient records to create new prescriptions.
        </p>
        <button
            type="button"
            onClick={onBrowseRecords}
            className="font-mono text-[11px] tracking-wider text-primary border border-border px-4 py-2 inline-block hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            aria-label="Browse records from the shell"
        >
            Browse Records &rarr;
        </button>
    </div>
));

EmptyPrescriptions.displayName = "EmptyPrescriptions";

// Order summary
const PrescriptionSummary = memo<{
    itemCount: number;
    totalRefills: number;
    onSubmit: () => void;
}>(({ itemCount, totalRefills, onSubmit }) => (
    <div className="border border-border p-5">
        <h3 className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground/70 uppercase mb-5">
            Prescription Summary
        </h3>

        <div className="space-y-3 mb-5">
            <div className="flex justify-between font-mono text-xs">
                <span className="text-muted-foreground">Patients</span>
                <span className="text-foreground">{itemCount}</span>
            </div>
            <div className="flex justify-between font-mono text-xs">
                <span className="text-muted-foreground">Total Refills</span>
                <span className="text-foreground">{totalRefills}</span>
            </div>
            <div className="flex justify-between font-mono text-xs">
                <span className="text-muted-foreground">Priority</span>
                <span className="text-chart-2">Standard</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between items-center">
                <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                    Status
                </span>
                <span className="font-sans font-semibold text-sm text-foreground">
                    Ready to Submit
                </span>
            </div>
        </div>

        <button
            onClick={onSubmit}
            className="w-full bg-primary text-primary-foreground font-mono text-[11px] tracking-wider py-2.5 hover:bg-primary/80 transition-colors duration-300"
            style={{ color: "var(--color-ink)" }}
            aria-label={`Submit ${itemCount} prescriptions with ${totalRefills} total refills`}
        >
            Submit Prescriptions &rarr;
        </button>

        <div className="mt-3 flex items-center justify-center gap-3 font-mono text-[10px] text-muted-foreground/70">
            <span>HIPAA Compliant</span>
            <span className="text-ring">&middot;</span>
            <span>E-Prescribing</span>
        </div>
    </div>
));

PrescriptionSummary.displayName = "PrescriptionSummary";

// Main component
function PrescriptionOrders() {
    const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
        { id: 1, patientName: "Sarah Chen", provider: "Dr. Williams", quantity: 1 },
        { id: 7, patientName: "Lisa Nguyen", provider: "Dr. Patel", quantity: 2 },
    ]);
    const { label: themeLabel } = useActiveTheme();

    // Listen for addPrescription events
    useEffect(() => {
        const handleAddPrescription = (event: AddPrescriptionEvent) => {
            const item: PrescriptionItem = event.detail;
            setPrescriptions((prev) => {
                const existing = prev.find((p) => p.id === item.id);
                if (existing) {
                    return prev.map((p) =>
                        p.id === item.id
                            ? { ...p, quantity: p.quantity + item.quantity }
                            : p
                    );
                }
                return [...prev, item];
            });
        };
        window.addEventListener("addPrescription", handleAddPrescription);
        return () => window.removeEventListener("addPrescription", handleAddPrescription);
    }, []);

    const updateQuantity = useCallback((id: number, delta: number) => {
        setPrescriptions((prev) =>
            prev.map((item) =>
                item.id === id
                    ? { ...item, quantity: Math.max(1, item.quantity + delta) }
                    : item
            )
        );
    }, []);

    const removeItem = useCallback((id: number) => {
        setPrescriptions((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const handleSubmit = useCallback(() => {
        window.dispatchEvent(
            new CustomEvent("showNotification", {
                detail: { type: "success", message: "Prescriptions submitted for pharmacy review!" },
            })
        );
    }, []);

    const handleBrowseRecords = useCallback(() => {
        window.dispatchEvent(
            new CustomEvent("navigateToModule", {
                detail: { module: "records" },
            })
        );
    }, []);

    const { totalRefills, itemCount } = useMemo(() => {
        const calculatedRefills = prescriptions.reduce(
            (sum, item) => sum + item.quantity,
            0
        );
        return { totalRefills: calculatedRefills, itemCount: prescriptions.length };
    }, [prescriptions]);

    return (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in" role="main">
            {/* Header */}
            <header className="mb-8 lg:mb-10 animate-fade-in-up border-b border-border pb-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground/70 uppercase block mb-2">
                            Active Orders
                        </span>
                        <h2 className="font-sans font-semibold text-2xl sm:text-3xl lg:text-4xl text-foreground tracking-tight leading-snug mb-2">
                            Prescriptions
                        </h2>
                        {prescriptions.length > 0 && (
                            <p className="text-muted-foreground text-sm">
                                {itemCount} prescription{itemCount !== 1 ? "s" : ""} pending submission
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3 self-start lg:self-auto">
                        <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground/70 uppercase">
                            Theme
                        </span>
                        <span className="border border-border bg-card/70 px-2.5 py-1 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                            {themeLabel}
                        </span>
                    </div>
                </div>
            </header>

            {prescriptions.length === 0 ? (
                <EmptyPrescriptions onBrowseRecords={handleBrowseRecords} />
            ) : (
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                    {/* Prescriptions list */}
                    <section className="flex-1 w-full" aria-label="Prescription items">
                        {/* Column headers */}
                        <div className="hidden sm:flex items-center gap-3 pb-2 border-b border-border mb-1 font-mono text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase">
                            <span className="w-11 shrink-0" />
                            <span className="flex-1">Patient</span>
                            <span className="w-[5.25rem]">Refills</span>
                            <span className="w-24 text-right">Count</span>
                            <span className="w-4" />
                        </div>
                        <div className="divide-y divide-border">
                            {prescriptions.map((item, index) => (
                                <PrescriptionRow
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    onUpdateQuantity={updateQuantity}
                                    onRemove={removeItem}
                                />
                            ))}
                        </div>
                    </section>

                    {/* Summary sidebar */}
                    <aside className="w-full lg:w-72 lg:sticky lg:top-6">
                        <PrescriptionSummary
                            itemCount={itemCount}
                            totalRefills={totalRefills}
                            onSubmit={handleSubmit}
                        />
                    </aside>
                </div>
            )}
        </div>
    );
}

PrescriptionOrders.displayName = "PrescriptionOrders";

export default PrescriptionOrders;
