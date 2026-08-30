export interface NavigateToModuleEvent extends CustomEvent {
  detail: {
    module: "records" | "prescriptions" | "analytics" | "home";
  };
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

export interface ModuleDestination {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly port: string;
  readonly path: string;
  readonly icon: string;
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
    navigateToModule: NavigateToModuleEvent;
    showNotification: NotificationEvent;
    themeChange: ThemeChangeEvent;
  }
}
