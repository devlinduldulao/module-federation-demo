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

declare global {
  interface Window {
    __MF_THEME__?: {
      getTheme: () => "dark" | "light";
      setTheme: (theme: "dark" | "light") => void;
    };
  }

  interface WindowEventMap {
    showNotification: NotificationEvent;
    themeChange: ThemeChangeEvent;
  }
}
