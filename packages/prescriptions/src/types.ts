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

export interface NavigateToModuleEvent extends CustomEvent {
  detail: {
    module: "records" | "prescriptions" | "analytics";
  };
}

/**
 * Client-state sync contract. Each module owns its own zustand store and agrees
 * only on this payload. `source` is the originating module id, so a listener can
 * ignore its own echo. Versioned contract: additive changes only.
 */
export type CounterChangeEvent = CustomEvent<{
  count: number;
  source: string;
}>;

declare global {
  interface Window {
    __MF_THEME__?: {
      getTheme: () => "dark" | "light";
      setTheme: (theme: "dark" | "light") => void;
    };
  }

  interface WindowEventMap {
    counterChange: CounterChangeEvent;
    addPrescription: AddPrescriptionEvent;
    showNotification: NotificationEvent;
    themeChange: ThemeChangeEvent;
    navigateToModule: NavigateToModuleEvent;
  }
}
