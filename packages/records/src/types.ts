export interface MedicalRecord {
  readonly id: number;
  readonly patientName: string;
  readonly recordType: string;
  readonly date: string;
  readonly status: string;
  readonly summary: string;
  readonly provider: string;
}

export interface PrescriptionItem {
  readonly id: number;
  readonly patientName: string;
  readonly provider: string;
  readonly quantity: number;
}

export type RecordCategory = "all" | "lab-results" | "imaging" | "consultation";

export interface AddPrescriptionEvent extends CustomEvent {
  detail: PrescriptionItem;
}

export interface NotificationEvent extends CustomEvent {
  detail: {
    type: "success" | "error" | "info" | "warning";
    message: string;
  };
}

export interface ThemeChangeEvent extends CustomEvent {
  detail: {
    theme: "dark" | "light";
    colorScheme: "dark" | "light";
  };
}

declare global {
  interface Window {
    __MF_THEME__?: {
      getTheme: () => "dark" | "light";
      setTheme: (theme: "dark" | "light") => void;
    };
  }

  interface WindowEventMap {
    addPrescription: AddPrescriptionEvent;
    showNotification: NotificationEvent;
    themeChange: ThemeChangeEvent;
  }
}
