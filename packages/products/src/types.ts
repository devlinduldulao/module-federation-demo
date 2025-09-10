export interface Product {
  readonly id: number;
  readonly name: string;
  readonly price: number;
  readonly image?: string;
  readonly category: string;
  readonly description: string;
}

export interface CartItem {
  readonly id: number;
  readonly name: string;
  readonly price: number;
  readonly quantity: number;
}

export type FilterCategory = "all" | "electronics" | "clothing" | "books";

export interface AddToCartEvent extends CustomEvent {
  detail: CartItem;
}

export interface NotificationEvent extends CustomEvent {
  detail: {
    type: "success" | "error" | "info" | "warning";
    message: string;
  };
}

declare global {
  interface WindowEventMap {
    addToCart: AddToCartEvent;
    showNotification: NotificationEvent;
  }
}
