import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { cn } from "./lib/utils";
import type { CartItem, AddToCartEvent } from "./types";

// Memoized components
const CartItemCard = memo<{
  item: CartItem;
  onUpdateQuantity: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
}>(({ item, onUpdateQuantity, onRemove }) => (
  <article
    className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-xl transition-all duration-500 hover:scale-[1.02] hover:border-purple-200 relative overflow-hidden"
    aria-label={`Cart item: ${item.name}`}
  >
    {/* Gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

    <div className="relative z-10">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400 rounded-2xl flex items-center justify-center text-3xl relative overflow-hidden group-hover:scale-110 transition-transform duration-300">
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="relative">�</span>
          </div>
          <div className="text-center sm:text-left">
            <h3 className="font-bold text-xl text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
              {item.name}
            </h3>
            <p className="text-gray-600 mt-1">
              <span className="text-lg font-semibold">
                ${item.price.toFixed(2)}
              </span>
              <span className="text-sm ml-2">each</span>
            </p>
            <div className="text-sm text-gray-500 mt-1">
              Premium quality • Fast delivery
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onUpdateQuantity(item.id, -1)}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all duration-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transform hover:scale-110"
              aria-label={`Decrease quantity of ${item.name}`}
              disabled={item.quantity <= 1}
            >
              <span className="text-lg font-bold">−</span>
            </button>
            <div className="flex flex-col items-center">
              <span
                className="w-16 text-center font-bold text-xl text-purple-600"
                aria-label={`Quantity: ${item.quantity}`}
              >
                {item.quantity}
              </span>
              <span className="text-xs text-gray-500">qty</span>
            </div>
            <button
              onClick={() => onUpdateQuantity(item.id, 1)}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-green-100 hover:text-green-600 flex items-center justify-center transition-all duration-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transform hover:scale-110"
              aria-label={`Increase quantity of ${item.name}`}
            >
              <span className="text-lg font-bold">+</span>
            </button>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              ${(item.price * item.quantity).toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">total</div>
          </div>

          <button
            onClick={() => onRemove(item.id)}
            className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition-all duration-300 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transform hover:scale-110"
            aria-label={`Remove ${item.name} from cart`}
          >
            <span className="text-lg font-bold">×</span>
          </button>
        </div>
      </div>
    </div>
  </article>
));

CartItemCard.displayName = "CartItemCard";

const EmptyCart = memo(() => (
  <div className="text-center py-20" role="region" aria-label="Empty cart">
    <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-8">
      <div
        className="text-6xl animate-bounce text-gray-700 font-bold"
        role="img"
        aria-hidden="true"
      >
        CART
      </div>
    </div>
    <h3 className="text-3xl font-bold text-gray-700 mb-4">
      Your cart is empty
    </h3>
    <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
      Looks like you haven't added any amazing products yet. Start exploring our
      collection!
    </p>
    <div className="flex justify-center">
      <div className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-gray-200 rounded-xl font-semibold">
        Continue Shopping
      </div>
    </div>
  </div>
));

EmptyCart.displayName = "EmptyCart";

const CartSummary = memo<{
  total: number;
  itemCount: number;
  onCheckout: () => void;
}>(({ total, itemCount, onCheckout }) => (
  <div className="w-full max-w-md bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 text-gray-200 rounded-2xl p-8 shadow-2xl shadow-purple-500/25 relative overflow-hidden">
    {/* Animated background */}
    <div
      className="absolute inset-0 bg-white/10 translate-x-[-100%] animate-pulse"
      style={{ animationDuration: "3s" }}
    />

    <div className="relative z-10">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
          <span className="text-2xl text-white font-bold">PAY</span>
        </div>
        <div className="text-sm opacity-90 mb-2">
          {itemCount} item{itemCount !== 1 ? "s" : ""} in your cart
        </div>
        <div className="text-4xl font-bold mb-2">${total.toFixed(2)}</div>
        <div className="text-sm opacity-75">Including taxes and fees</div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="opacity-90">Subtotal:</span>
          <span>${(total * 0.9).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="opacity-90">Shipping:</span>
          <span className="text-green-300">FREE</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="opacity-90">Tax:</span>
          <span>${(total * 0.1).toFixed(2)}</span>
        </div>
        <hr className="border-white/20" />
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={onCheckout}
        className="group w-full bg-white text-purple-600 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 focus:outline-hidden focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-600 transform hover:scale-105 relative overflow-hidden"
        aria-label={`Proceed to checkout with ${itemCount} items totaling $${total.toFixed(
          2
        )}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
        <span className="relative flex items-center justify-center gap-2">
          <span>Proceed to Checkout</span>
        </span>
      </button>

      <div className="text-center mt-4">
        <div className="text-xs opacity-75 flex items-center justify-center gap-2">
          <span>Secure checkout</span>
          <span>•</span>
          <span>30-day returns</span>
        </div>
      </div>
    </div>
  </div>
));

CartSummary.displayName = "CartSummary";

// Main component
function ShoppingCart(): JSX.Element {
  const [cartItems, setCartItems] = useState<CartItem[]>([
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
  ]);

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
          message: "Checkout feature coming soon!",
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
    <div className="w-full max-w-5xl mx-auto" role="main">
      <header className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl mb-6">
          <span
            className="text-4xl animate-pulse text-white font-bold"
            role="img"
            aria-label="shopping cart"
          >
            CART
          </span>
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Shopping Cart
        </h2>
        {cartItems.length > 0 && (
          <p className="text-gray-600 text-lg">
            {itemCount} premium item{itemCount !== 1 ? "s" : ""} ready for
            checkout
          </p>
        )}
      </header>

      {cartItems.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <section className="flex-1 space-y-6" aria-label="Cart items">
            {cartItems.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </section>

          <div className="lg:sticky lg:top-8">
            <CartSummary
              total={total}
              itemCount={itemCount}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      )}
    </div>
  );
}

ShoppingCart.displayName = "ShoppingCart";

export default ShoppingCart;
