declare module "*.css";

declare module "products/ProductsCatalog" {
  const ProductsCatalog: import("react").ComponentType;
  export default ProductsCatalog;
}

declare module "products/StreamingProductsCatalog" {
  const StreamingProductsCatalog: import("react").ComponentType;
  export function __resetProductsStreamingResourceCache(): void;
  export default StreamingProductsCatalog;
}

declare module "cart/ShoppingCart" {
  const ShoppingCart: import("react").ComponentType;
  export default ShoppingCart;
}

declare module "cart/StreamingShoppingCart" {
  const StreamingShoppingCart: import("react").ComponentType;
  export function __resetCartStreamingResourceCache(): void;
  export default StreamingShoppingCart;
}

declare module "dashboard/UserDashboard" {
  const UserDashboard: import("react").ComponentType;
  export default UserDashboard;
}

declare module "dashboard/StreamingUserDashboard" {
  const StreamingUserDashboard: import("react").ComponentType;
  export function __resetDashboardStreamingResourceCache(): void;
  export default StreamingUserDashboard;
}

interface Window {
  __MF_THEME__?: {
    getTheme: () => "dark" | "dim" | "light";
    setTheme: (theme: "dark" | "dim" | "light") => void;
  };
}

interface WindowEventMap {
  moduleChange: CustomEvent<{
    newModule: "products" | "cart" | "dashboard";
  }>;
  navigateToModule: CustomEvent<{
    module: "products" | "cart" | "dashboard";
  }>;
  themeChange: CustomEvent<{
    theme: "dark" | "dim" | "light";
    colorScheme: "dark" | "light";
  }>;
  showNotification: CustomEvent<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  }>;
  addToCart: CustomEvent<{
    id: number;
    name: string;
    price: number;
    quantity: number;
  }>;
}
