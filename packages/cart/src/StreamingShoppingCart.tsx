import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "./lib/utils";
import type { CartItem, AddToCartEvent } from "./types";

// Simulate network delay for demonstration
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Enhanced cart items for demo
const INITIAL_CART_ITEMS: CartItem[] = [
  {
    id: 1,
    name: "MacBook Pro M3",
    price: 2499.99,
    quantity: 1,
  },
  {
    id: 7,
    name: "AirPods Pro",
    price: 249.99,
    quantity: 2,
  },
];

// Resource-based Suspense pattern for React 18+
interface Resource<T> {
  read(): T;
}

function createResource<T>(asyncFn: () => Promise<T>): Resource<T> {
  let status = "pending";
  let result: T;
  let suspender = asyncFn().then(
    (data) => {
      status = "success";
      result = data;
    },
    (error) => {
      status = "error";
      result = error;
    }
  );

  return {
    read() {
      if (status === "pending") {
        throw suspender;
      } else if (status === "error") {
        throw result;
      } else if (status === "success") {
        return result;
      }
      throw new Error("Invalid resource state");
    },
  };
}

const resourceCache = new Map<string, Resource<void>>();

function getResource(key: string, delayMs: number): Resource<void> {
  if (!resourceCache.has(key)) {
    const resource = createResource(() => delay(delayMs));
    resourceCache.set(key, resource);
  }
  return resourceCache.get(key)!;
}

let currentResourceKey = "cart-initial";

// Modern Suspense component
const StreamingShoppingCart = () => {
  const resource = getResource(currentResourceKey, 3500);
  resource.read();
  return <ShoppingCart />;
};

// Main component
function ShoppingCart(): JSX.Element {
  const [cartItems, setCartItems] = useState<CartItem[]>(INITIAL_CART_ITEMS);

  // Event listener for adding items to cart
  useEffect(() => {
    const handleAddToCart = (event: AddToCartEvent) => {
      const cartItem: CartItem = event.detail;

      setCartItems((prev) => {
        const existing = prev.find((item) => item.id === cartItem.id);
        if (existing) {
          return prev.map((item) =>
            item.id === cartItem.id
              ? { ...item, quantity: item.quantity + cartItem.quantity }
              : item
          );
        }
        return [...prev, cartItem];
      });
    };

    window.addEventListener("addToCart", handleAddToCart);
    return () => window.removeEventListener("addToCart", handleAddToCart);
  }, []);

  const updateQuantity = useCallback((id: number, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  }, []);

  const removeItem = useCallback((id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleCheckout = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent("showNotification", {
        detail: {
          type: "success",
          message: "Order placed successfully",
        },
      })
    );
  }, []);

  const { total, itemCount } = useMemo(() => {
    const calculatedTotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const calculatedItemCount = cartItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    return { total: calculatedTotal, itemCount: calculatedItemCount };
  }, [cartItems]);

  return (
    <div className="w-full max-w-5xl mx-auto" role="main">
      {/* Header */}
      <header className="mb-12 animate-fade-in-up">
        <span className="font-mono text-[11px] tracking-[0.3em] text-dim uppercase block mb-3">
          Your Order
        </span>
        <h2 className="font-display text-5xl lg:text-6xl italic text-cream tracking-tight leading-none mb-3">
          Shopping Cart
        </h2>
        {cartItems.length > 0 && (
          <span className="font-mono text-sm text-stone">
            {itemCount} item{itemCount !== 1 ? "s" : ""} &middot; ${total.toFixed(2)}
          </span>
        )}
      </header>

      {cartItems.length === 0 ? (
        <div className="py-24 text-center animate-fade-in-up">
          <div className="w-20 h-20 border border-edge mx-auto mb-8 flex items-center justify-center">
            <span className="font-mono text-[10px] text-dim tracking-wider">EMPTY</span>
          </div>
          <h3 className="font-display text-3xl italic text-cream mb-4">
            Your cart is empty
          </h3>
          <p className="text-stone text-sm max-w-md mx-auto mb-8">
            Products from the catalog will appear here when added. Navigate to the Products tab to start shopping.
          </p>
          <div className="font-mono text-[11px] text-dim tracking-wider">
            TIP: ITEMS FROM OTHER MODULES SYNC AUTOMATICALLY
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Cart items — table-like list */}
          <section className="flex-1 w-full" aria-label="Cart items">
            {/* Column headers */}
            <div className="flex items-center gap-4 pb-3 border-b border-edge font-mono text-[10px] tracking-[0.2em] text-dim uppercase animate-fade-in-up">
              <span className="flex-1">Product</span>
              <span className="w-32 text-center hidden sm:block">Quantity</span>
              <span className="w-28 text-right">Total</span>
              <span className="w-8" />
            </div>

            {cartItems.map((item, index) => (
              <article
                key={item.id}
                className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 py-6 border-b border-edge hover:bg-surface/50 transition-colors duration-300 animate-fade-in-up"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
                aria-label={`Cart item: ${item.name}`}
              >
                {/* Product info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-16 h-16 bg-surface flex-shrink-0 flex items-center justify-center group-hover:bg-elevated transition-colors duration-300">
                    <span className="font-mono text-[9px] text-dim">IMG</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg italic text-cream group-hover:text-citrine transition-colors duration-300 truncate">
                      {item.name}
                    </h3>
                    <span className="font-mono text-sm text-stone">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-0 w-32 justify-center">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-8 h-8 border border-edge text-stone hover:border-cream hover:text-cream flex items-center justify-center transition-all duration-200 focus:outline-hidden font-mono text-sm"
                    aria-label={`Decrease quantity of ${item.name}`}
                    disabled={item.quantity <= 1}
                  >
                    &minus;
                  </button>
                  <span className="w-10 h-8 border-t border-b border-edge flex items-center justify-center font-mono text-sm text-cream">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-8 h-8 border border-edge text-stone hover:border-cream hover:text-cream flex items-center justify-center transition-all duration-200 focus:outline-hidden font-mono text-sm"
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    +
                  </button>
                </div>

                {/* Line total */}
                <div className="w-28 text-right">
                  <span className="font-mono text-cream">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="w-8 h-8 text-dim hover:text-rose transition-colors duration-200 flex items-center justify-center font-mono text-xs focus:outline-hidden"
                  aria-label={`Remove ${item.name} from cart`}
                >
                  &times;
                </button>
              </article>
            ))}
          </section>

          {/* Order summary — sticky sidebar */}
          <aside className="lg:sticky lg:top-8 w-full lg:w-80 animate-slide-in-right" style={{ animationDelay: "200ms" }}>
            <div className="border border-edge p-6">
              <h3 className="font-mono text-[11px] tracking-[0.3em] text-dim uppercase mb-6">
                Order Summary
              </h3>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone">Subtotal</span>
                  <span className="font-mono text-cream">${(total * 0.9).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone">Shipping</span>
                  <span className="font-mono text-mint">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone">Tax</span>
                  <span className="font-mono text-cream">${(total * 0.1).toFixed(2)}</span>
                </div>
                <div className="border-t border-edge pt-3 flex justify-between">
                  <span className="text-cream font-medium">Total</span>
                  <span className="font-mono text-xl text-cream">${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="group w-full bg-citrine text-noir py-3 font-mono text-sm tracking-wider uppercase hover:bg-citrine-dim transition-all duration-300 focus:outline-hidden relative overflow-hidden"
                aria-label={`Checkout ${itemCount} items for $${total.toFixed(2)}`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>Checkout</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
                </span>
              </button>

              <div className="mt-4 font-mono text-[10px] text-dim text-center tracking-wider">
                SECURE CHECKOUT &middot; 30-DAY RETURNS
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Module boundary indicator */}
      <div className="mt-12 pt-6 border-t border-edge animate-fade-in-up" style={{ animationDelay: "400ms" }}>
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-citrine animate-subtle-pulse" />
          <span className="font-mono text-[11px] tracking-wider text-dim">
            CART MICRO-FRONTEND &middot; PORT 3002 &middot; REAL-TIME UPDATES
          </span>
        </div>
      </div>
    </div>
  );
}

ShoppingCart.displayName = "ShoppingCart";

export default StreamingShoppingCart;
