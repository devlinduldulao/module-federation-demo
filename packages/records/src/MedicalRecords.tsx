import { useState, useCallback, useMemo, memo } from "react";
import { cn } from "./lib/utils";
import { MedicalRecord, PrescriptionItem, RecordCategory } from "./types";
import { useActiveTheme } from "./lib/theme";

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
  reviewed: "text-mint",
  pending: "text-citrine",
  critical: "text-rose",
};

// Record card component
const RecordCard = memo<{
  record: MedicalRecord;
  index: number;
  onAddPrescription: (record: MedicalRecord) => void;
}>(({ record, index, onAddPrescription }) => (
  <article
    className="group bg-noir flex flex-col animate-fade-in-up"
    style={{ animationDelay: `${index * 80}ms` }}
    role="article"
    aria-label={`Record: ${record.patientName}`}
  >
    {/* Type indicator */}
    <div className="aspect-[3/1] bg-elevated relative overflow-hidden flex items-center justify-center">
      <span className="font-mono text-sm text-dim tracking-wider">
        {record.recordType === "lab-results" ? "LAB" : record.recordType === "imaging" ? "IMG" : "CONSULT"}
      </span>
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-citrine scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </div>

    <div className="p-5 flex flex-col flex-1">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] tracking-[0.2em] text-dim uppercase">
          {CATEGORY_LABELS[record.recordType as RecordCategory] ?? record.recordType}
        </span>
        <span className={cn("font-mono text-[10px] tracking-wider uppercase", STATUS_COLORS[record.status] ?? "text-dim")}>
          {record.status}
        </span>
      </div>
      <h3 className="font-display text-lg italic text-cream mb-1 group-hover:text-citrine transition-colors duration-300">
        {record.patientName}
      </h3>
      <p className="text-stone text-sm leading-relaxed line-clamp-2 mb-4 flex-1">
        {record.summary}
      </p>

      <div className="flex items-end justify-between pt-4 border-t border-edge">
        <div>
          <span className="font-mono text-[10px] text-dim block">{record.provider}</span>
          <span className="font-mono text-xs text-stone">{record.date}</span>
        </div>
        <button
          onClick={() => onAddPrescription(record)}
          className="font-mono text-xs tracking-wider text-citrine border border-edge px-4 py-2 hover:bg-citrine hover:text-ink transition-all duration-300"
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
    <div className="w-full mx-auto animate-fade-in" role="main">
      {/* Header */}
      <header className="mb-16 lg:mb-24 animate-fade-in-up">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="font-mono text-[11px] tracking-[0.3em] text-dim uppercase block mb-3">
              Patient Files
            </span>
            <h2 className="font-display text-5xl lg:text-6xl italic text-cream tracking-tight leading-none mb-3">
              Records
            </h2>
            <p className="text-stone text-sm max-w-xl">
              Clinical records across lab results, imaging, and consultations for active patients.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start lg:self-auto">
            <span className="font-mono text-[10px] tracking-[0.3em] text-dim uppercase">
              Theme
            </span>
            <span className="border border-edge bg-surface/70 px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-stone uppercase">
              {themeLabel}
            </span>
          </div>
        </div>
      </header>

      {/* Filters */}
      <nav
        className="flex items-center gap-6 mb-10 border-b border-edge pb-4 animate-fade-in-up"
        style={{ animationDelay: "100ms" }}
        role="navigation"
        aria-label="Record category filters"
      >
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            className={cn(
              "font-mono text-xs tracking-wider uppercase pb-2 transition-all duration-300 relative",
              selectedCategory === category
                ? "text-cream"
                : "text-dim hover:text-stone"
            )}
            aria-pressed={selectedCategory === category}
          >
            {CATEGORY_LABELS[category]}
            {selectedCategory === category && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-citrine" />
            )}
          </button>
        ))}
        <span className="ml-auto font-mono text-[11px] text-dim">
          {filteredRecords.length} record{filteredRecords.length !== 1 ? "s" : ""}
        </span>
      </nav>

      {/* Records grid */}
      <section aria-label="Records grid">
        {filteredRecords.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
            {filteredRecords.map((record, index) => (
              <div key={record.id} className="bg-edge p-px">
                <RecordCard
                  record={record}
                  index={index}
                  onAddPrescription={handleAddPrescription}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 border border-edge">
            <span className="font-mono text-sm text-dim block mb-3">
              No results
            </span>
            <h3 className="font-display text-2xl italic text-cream mb-2">
              Nothing found
            </h3>
            <p className="text-stone text-sm">
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
