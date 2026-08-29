import { useState, useCallback, useMemo, memo } from "react";
import { cn } from "./lib/utils";
import { MedicalRecord, PrescriptionItem, RecordCategory } from "./types";
import { useActiveTheme } from "./lib/theme";
import "./index.css";

const MOCK_RECORDS: readonly MedicalRecord[] = [
  {
    id: 1,
    patientName: "Sarah Chen",
    recordType: "lab-results",
    date: "2026-04-12",
    status: "reviewed",
    summary: "Complete blood count within normal ranges. Cholesterol slightly elevated.",
    provider: "Dr. Williams",
  },
  {
    id: 2,
    patientName: "James Rodriguez",
    recordType: "imaging",
    date: "2026-04-10",
    status: "pending",
    summary: "Chest X-ray ordered for persistent cough. Awaiting radiologist review.",
    provider: "Dr. Patel",
  },
  {
    id: 3,
    patientName: "Emily Watson",
    recordType: "consultation",
    date: "2026-04-08",
    status: "reviewed",
    summary: "Follow-up for Type 2 diabetes management. HbA1c improved to 6.8%.",
    provider: "Dr. Kim",
  },
  {
    id: 4,
    patientName: "Michael Torres",
    recordType: "lab-results",
    date: "2026-04-06",
    status: "critical",
    summary: "Elevated troponin levels detected. Cardiology consult recommended urgently.",
    provider: "Dr. Gupta",
  },
  {
    id: 5,
    patientName: "Anna Kowalski",
    recordType: "imaging",
    date: "2026-04-04",
    status: "reviewed",
    summary: "MRI lumbar spine: mild disc herniation L4-L5. No surgical intervention needed.",
    provider: "Dr. Nakamura",
  },
  {
    id: 6,
    patientName: "David Park",
    recordType: "consultation",
    date: "2026-04-02",
    status: "pending",
    summary: "Initial consultation for chronic migraine management. Medication trial initiated.",
    provider: "Dr. Williams",
  },
  {
    id: 7,
    patientName: "Lisa Nguyen",
    recordType: "lab-results",
    date: "2026-03-30",
    status: "reviewed",
    summary: "Thyroid function panel normal. TSH 2.1 mIU/L within reference range.",
    provider: "Dr. Patel",
  },
  {
    id: 8,
    patientName: "Robert Fischer",
    recordType: "imaging",
    date: "2026-03-28",
    status: "reviewed",
    summary: "Echocardiogram shows normal ejection fraction at 62%. No valve abnormalities.",
    provider: "Dr. Kim",
  },
] as const;

const CATEGORIES: readonly RecordCategory[] = [
  "all",
  "lab-results",
  "imaging",
  "consultation",
] as const;

const CATEGORY_LABELS: Record<RecordCategory, string> = {
  all: "All",
  "lab-results": "Lab Results",
  imaging: "Imaging",
  consultation: "Consultation",
};

const STATUS_COLORS: Record<string, string> = {
  reviewed: "text-chart-2",
  pending: "text-primary",
  critical: "text-destructive",
};

// Record card component
const RecordCard = memo<{
  record: MedicalRecord;
  index: number;
  onAddPrescription: (record: MedicalRecord) => void;
}>(({ record, index, onAddPrescription }) => (
  <article
    className="group bg-background flex flex-col animate-fade-in-up"
    style={{ animationDelay: `${index * 80}ms` }}
    role="article"
    aria-label={`Record: ${record.patientName}`}
  >
    {/* Type indicator */}
    <div className="aspect-3/1 bg-muted relative overflow-hidden flex items-center justify-center">
      <span className="font-mono text-sm text-muted-foreground/70 tracking-wider">
        {record.recordType === "lab-results" ? "LAB" : record.recordType === "imaging" ? "IMG" : "CONSULT"}
      </span>
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </div>

    <div className="p-4 sm:p-5 flex flex-col flex-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase">
          {CATEGORY_LABELS[record.recordType as RecordCategory] ?? record.recordType}
        </span>
        <span className={cn("font-mono text-[10px] tracking-wider uppercase", STATUS_COLORS[record.status] ?? "text-muted-foreground/70")}>
          {record.status}
        </span>
      </div>
      <h3 className="font-sans font-semibold text-base text-foreground mb-1 group-hover:text-primary transition-colors duration-300">
        {record.patientName}
      </h3>
      <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-3 flex-1">
        {record.summary}
      </p>

      <div className="flex items-end justify-between pt-3 border-t border-border">
        <div>
          <span className="font-mono text-[10px] text-muted-foreground/70 block">{record.provider}</span>
          <span className="font-mono text-[11px] text-muted-foreground">{record.date}</span>
        </div>
        <button
          onClick={() => onAddPrescription(record)}
          className="font-mono text-[11px] tracking-wider text-primary border border-border px-3 py-1.5 hover:bg-primary hover:text-primary-foreground transition-all duration-300 rounded-md"
          aria-label={`Create prescription for ${record.patientName}`}
        >
          Prescribe &rarr;
        </button>
      </div>
    </div>
  </article>
));

RecordCard.displayName = "RecordCard";

function MedicalRecords() {
  const [selectedCategory, setSelectedCategory] =
    useState<RecordCategory>("all");
  const { label: themeLabel } = useActiveTheme();

  const filteredRecords = useMemo(() => {
    return MOCK_RECORDS.filter(
      (record) =>
        selectedCategory === "all" || record.recordType === selectedCategory
    );
  }, [selectedCategory]);

  const handleCategoryChange = useCallback((category: RecordCategory) => {
    setSelectedCategory(category);
  }, []);

  const handleAddPrescription = useCallback((record: MedicalRecord) => {
    const prescriptionItem: PrescriptionItem = {
      id: record.id,
      patientName: record.patientName,
      provider: record.provider,
      quantity: 1,
    };

    try {
      window.dispatchEvent(
        new CustomEvent("addPrescription", {
          detail: prescriptionItem,
          bubbles: true,
        })
      );
      window.dispatchEvent(
        new CustomEvent("showNotification", {
          detail: {
            type: "success",
            message: `Prescription created for ${record.patientName}`,
          },
        })
      );
    } catch (error) {
      console.error("Failed to create prescription:", error);
    }
  }, []);

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in" role="main">
      {/* Header */}
      <header className="mb-8 lg:mb-10 animate-fade-in-up">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground/70 uppercase block mb-2">
              Patient Files
            </span>
            <h2 className="font-sans font-semibold text-2xl sm:text-3xl lg:text-4xl text-foreground tracking-tight leading-snug mb-2">
              Records
            </h2>
            <p className="text-muted-foreground text-sm max-w-xl">
              Clinical records across lab results, imaging, and consultations for active patients.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start lg:self-auto">
            <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground/70 uppercase">
              Theme
            </span>
            <span className="border border-border bg-card/70 px-2.5 py-1 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase rounded-md">
              {themeLabel}
            </span>
          </div>
        </div>
      </header>

      {/* Filters */}
      <nav
        className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6 border-b border-border pb-3 animate-fade-in-up"
        style={{ animationDelay: "100ms" }}
        role="navigation"
        aria-label="Record category filters"
      >
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            className={cn(
              "font-mono text-[11px] tracking-wider uppercase pb-1.5 transition-all duration-300 relative whitespace-nowrap",
              selectedCategory === category
                ? "text-foreground"
                : "text-muted-foreground/70 hover:text-muted-foreground"
            )}
            aria-pressed={selectedCategory === category}
          >
            {CATEGORY_LABELS[category]}
            {selectedCategory === category && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
            )}
          </button>
        ))}
        <span className="ml-auto font-mono text-[10px] text-muted-foreground/70 whitespace-nowrap">
          {filteredRecords.length} record{filteredRecords.length !== 1 ? "s" : ""}
        </span>
      </nav>

      {/* Records grid */}
      <section aria-label="Records grid">
        {filteredRecords.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-5">
            {filteredRecords.map((record, index) => (
              <div key={record.id} className="bg-border p-px">
                <RecordCard
                  record={record}
                  index={index}
                  onAddPrescription={handleAddPrescription}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-border rounded-md">
            <span className="font-mono text-xs text-muted-foreground/70 block mb-2">
              No results
            </span>
            <h3 className="font-sans font-semibold text-lg text-foreground mb-1">
              Nothing found
            </h3>
            <p className="text-muted-foreground text-sm">
              Try selecting a different category
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

MedicalRecords.displayName = "MedicalRecords";

export default MedicalRecords;
