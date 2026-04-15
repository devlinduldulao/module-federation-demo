export interface Product {
  readonly id: number;
  readonly name: string;
  readonly price: number;
  readonly image: string;
  readonly category: string;
  readonly description: string;
}

export interface CartItem {
  readonly id: number;
  readonly name: string;
  readonly price: number;
  readonly quantity: number;
}

export interface AddToCartEvent extends CustomEvent {
  detail: CartItem;
}

export interface NotificationEvent extends CustomEvent {
  detail: {
    type: "success" | "error" | "info" | "warning";
    message: string;
  };
}

export interface ThemeChangeEvent extends CustomEvent {
  detail: {
    theme: "dark" | "dim" | "light";
    colorScheme: "dark" | "light";
  };
}

export interface NavigateToModuleEvent extends CustomEvent {
  detail: {
    module: "products" | "cart" | "dashboard";
  };
}

declare global {
  interface Window {
    __MF_THEME__?: {
      getTheme: () => "dark" | "dim" | "light";
      setTheme: (theme: "dark" | "dim" | "light") => void;
    };
  }

  interface WindowEventMap {
    addToCart: AddToCartEvent;
    showNotification: NotificationEvent;
    themeChange: ThemeChangeEvent;
    navigateToModule: NavigateToModuleEvent;
  }
}
