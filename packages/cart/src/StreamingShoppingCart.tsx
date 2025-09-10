import { useState, useEffect, useCallback, useMemo, memo } from "react";
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

// Global resource cache with proper invalidation
const resourceCache = new Map<string, Resource<void>>();

function getResource(key: string, delayMs: number): Resource<void> {
  if (!resourceCache.has(key)) {
    const resource = createResource(() => delay(delayMs));
    resourceCache.set(key, resource);
  }
  return resourceCache.get(key)!;
}

function clearResourceCache() {
  resourceCache.clear();
}

// Module-specific resource keys
let currentResourceKey = "cart-initial";

/**
 * CACHE INVALIDATION LOGIC - COMMENTED OUT FOR BETTER UX
 *
 * This code was originally designed for Module Federation demo purposes to showcase:
 * - React 18 Suspense streaming capabilities
 * - Independent loading states for each micro-frontend
 * - Realistic network simulation with loading skeletons
 *
 * However, it causes skeletons to re-appear every time you navigate back to a
 * previously visited page, which creates a poor user experience.
 *
 * Commenting this out means:
 * ✅ Resources stay cached after first load
 * ✅ No skeleton re-showing on revisit
 * ✅ Better perceived performance
 * ✅ More realistic production behavior
 */
/*
// Listen for module changes globally
if (typeof window !== "undefined") {
  window.addEventListener("moduleChange", (event: any) => {
    if (event.detail.newModule === "cart") {
      currentResourceKey = `cart-${Date.now()}`;
      // Clear only cart resources to force fresh load
      Array.from(resourceCache.keys())
        .filter((key) => key.startsWith("cart-"))
        .forEach((key) => resourceCache.delete(key));
    }
  });
}
*/

// Modern Suspense component following React 18+ best practices
const StreamingShoppingCart = () => {
  // Read from resource - this will throw promise if not ready
  const resource = getResource(currentResourceKey, 3500);
  resource.read(); // Throws promise for Suspense if not ready

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

  // Callbacks
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
    // Simulate checkout process
    window.dispatchEvent(
      new CustomEvent("showNotification", {
        detail: {
          type: "success",
          message: "Checkout simulation complete! Order placed successfully!",
        },
      })
    );
  }, []);

  // Memoized calculations
  const { total, itemCount } = useMemo(() => {
    const calculatedTotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const calculatedItemCount = cartItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    return {
      total: calculatedTotal,
      itemCount: calculatedItemCount,
    };
  }, [cartItems]);

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-up" role="main">
      <header className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600 rounded-3xl mb-6 animate-bounce">
          <span className="text-gray-200 font-bold text-xl">CART</span>
        </div>
        <h2 className="text-4xl font-bold text-slate-900 mb-4">
          Shopping Cart
        </h2>
        {cartItems.length > 0 && (
          <p className="text-slate-600 text-lg">
            {itemCount} premium item{itemCount !== 1 ? "s" : ""} ready for
            checkout
          </p>
        )}
      </header>

      {cartItems.length === 0 ? (
        <div className="text-center py-20 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-slate-100 rounded-full mb-8">
            <span className="text-slate-500 font-bold text-lg">EMPTY</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-700 mb-4">
            Your cart is empty
          </h3>
          <p className="text-slate-500 text-lg mb-8 max-w-md mx-auto">
            Looks like you haven't added any premium items to your cart yet.
            Start exploring our collection!
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 border border-green-200 rounded-full text-green-700 text-sm font-medium">
            <span className="font-bold">TIP:</span>
            <span>
              Products from other modules will appear here automatically
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <section className="flex-1 space-y-6" aria-label="Cart items">
            {cartItems.map((item, index) => (
              <article
                key={item.id}
                className="group bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-500 hover:scale-[1.02] hover:border-green-200 relative overflow-hidden animate-slide-in-left"
                style={{ animationDelay: `${index * 200}ms` }}
                aria-label={`Cart item: ${item.name}`}
              >
                <div className="absolute inset-0 bg-green-50 opacity-0 group-hover:opacity-50 transition-opacity duration-300 rounded-2xl" />

                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center text-3xl relative overflow-hidden group-hover:scale-110 transition-transform duration-300">
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <span className="relative text-green-600 font-bold text-sm">
                          ITEM
                        </span>
                      </div>
                      <div className="text-center sm:text-left">
                        <h3 className="font-bold text-xl text-slate-900 group-hover:text-green-600 transition-colors duration-300">
                          {item.name}
                        </h3>
                        <p className="text-slate-600 mt-1">
                          <span className="text-lg font-semibold">
                            ${item.price.toFixed(2)}
                          </span>
                          <span className="text-sm ml-2">each</span>
                        </p>
                        <div className="text-sm text-slate-500 mt-1">
                          Premium quality • Fast delivery
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all duration-300 focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:scale-110"
                          aria-label={`Decrease quantity of ${item.name}`}
                          disabled={item.quantity <= 1}
                        >
                          <span className="text-lg font-bold">−</span>
                        </button>
                        <div className="flex flex-col items-center">
                          <span className="text-xl font-bold text-green-600 px-4 py-2 bg-green-50 rounded-lg min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <span className="text-xs text-slate-500 mt-1">
                            qty
                          </span>
                        </div>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-green-100 hover:text-green-600 flex items-center justify-center transition-all duration-300 focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:scale-110"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <span className="text-lg font-bold">+</span>
                        </button>
                      </div>

                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500">total</div>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="group/remove w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 flex items-center justify-center transition-all duration-300 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transform hover:scale-110"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <span className="text-lg transition-transform duration-300 group-hover/remove:scale-125">
                          ×
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <div className="lg:sticky lg:top-8">
            <div className="w-full max-w-md bg-green-50 border border-green-200 rounded-2xl p-8 shadow-sm animate-slide-in-right">
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
                    <span className="text-green-600 font-bold text-sm">
                      PAY
                    </span>
                  </div>
                  <div className="text-sm text-green-600 mb-2">
                    {itemCount} item{itemCount !== 1 ? "s" : ""} in your cart
                  </div>
                  <div className="text-4xl font-bold text-green-700 mb-2">
                    ${total.toFixed(2)}
                  </div>
                  <div className="text-sm text-green-600">
                    Including taxes and fees
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Subtotal:</span>
                    <span>${(total * 0.9).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Shipping:</span>
                    <span className="text-green-500 font-medium">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Tax:</span>
                    <span>${(total * 0.1).toFixed(2)}</span>
                  </div>
                  <hr className="border-green-200" />
                  <div className="flex justify-between font-bold text-green-700">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="group w-full bg-green-600 text-gray-200 py-4 rounded-xl font-bold hover:bg-green-700 transition-all duration-300 focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:scale-105 relative overflow-hidden"
                  aria-label={`Proceed to checkout with ${itemCount} items totaling $${total.toFixed(
                    2
                  )}`}
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                  <span className="relative flex items-center justify-center gap-2">
                    <span>Proceed to Checkout</span>
                  </span>
                </button>

                <div className="text-center mt-4">
                  <div className="text-xs text-green-600 flex items-center justify-center gap-2">
                    <span>Secure checkout</span>
                    <span>•</span>
                    <span>30-day returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module boundary indicator for conference demo */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-50 border border-green-200 rounded-full text-green-700">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-semibold">Cart Micro-Frontend</span>
          </div>
          <div className="h-4 w-px bg-green-300" />
          <span className="text-sm">Streaming from Port 3002</span>
          <div className="h-4 w-px bg-green-300" />
          <span className="text-xs">Real-time Updates</span>
        </div>
      </div>
    </div>
  );
}

ShoppingCart.displayName = "ShoppingCart";

// Export the streaming wrapper as default for Suspense
export default StreamingShoppingCart;
