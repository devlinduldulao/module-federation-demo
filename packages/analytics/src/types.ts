export interface AnalyticsStat {
  readonly label: string;
  readonly value: string | number;
  readonly trend: "up" | "down" | "stable";
  readonly trendValue: string;
}

export interface ClinicalActivity {
  readonly id: number;
  readonly description: string;
  readonly timestamp: string;
  readonly type: "admission" | "discharge" | "alert" | "prescription" | "lab";
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
    showNotification: NotificationEvent;
    themeChange: ThemeChangeEvent;
  }
}
