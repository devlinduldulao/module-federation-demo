declare module "products/ProductsCatalog" {
  const ProductsCatalog: React.ComponentType;
  export default ProductsCatalog;
}

declare module "products/StreamingProductsCatalog" {
  const StreamingProductsCatalog: React.ComponentType;
  export default StreamingProductsCatalog;
}

declare module "cart/ShoppingCart" {
  const ShoppingCart: React.ComponentType;
  export default ShoppingCart;
}

declare module "cart/StreamingShoppingCart" {
  const StreamingShoppingCart: React.ComponentType;
  export default StreamingShoppingCart;
}

declare module "dashboard/UserDashboard" {
  const UserDashboard: React.ComponentType;
  export default UserDashboard;
}

declare module "dashboard/StreamingUserDashboard" {
  const StreamingUserDashboard: React.ComponentType;
  export default StreamingUserDashboard;
}

declare global {
  interface Window {
    __MF_THEME__?: {
      getTheme: () => "dark" | "dim" | "light";
      setTheme: (theme: "dark" | "dim" | "light") => void;
    };
  }

  interface WindowEventMap {
    themeChange: CustomEvent<{
      theme: "dark" | "dim" | "light";
      colorScheme: "dark" | "light";
    }>;
  }
}

export {};
