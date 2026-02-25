import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { cn } from "./lib/utils";
import type { CartItem, AddToCartEvent } from "./types";

// Cart item row
const CartItemRow = memo<{
  item: CartItem;
  index: number;
  onUpdateQuantity: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
}>(({ item, index, onUpdateQuantity, onRemove }) => (
  <article
    className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 py-5 animate-fade-in-up"
    style={{ animationDelay: `${index * 80}ms` }}
    aria-label={`Cart item: ${item.name}`}
  >
    {/* Image placeholder */}
    <div className="w-16 h-16 bg-elevated flex-shrink-0 flex items-center justify-center">
      <span className="font-mono text-[10px] text-dim">IMG</span>
    </div>

    {/* Product info */}
    <div className="flex-1 min-w-0">
      <h3 className="font-display text-lg italic text-cream group-hover:text-citrine transition-colors duration-200">
        {item.name}
      </h3>
      <span className="font-mono text-sm text-stone">
        ${item.price.toFixed(2)} each
      </span>
    </div>

    {/* Quantity controls */}
    <div className="flex items-center border border-edge">
      <button
        onClick={() => onUpdateQuantity(item.id, -1)}
        disabled={item.quantity <= 1}
        className="w-9 h-9 flex items-center justify-center font-mono text-sm text-stone hover:text-cream hover:bg-surface transition-colors duration-200 disabled:opacity-30"
        aria-label={`Decrease quantity of ${item.name}`}
      >
        −
      </button>
      <span className="w-10 h-9 flex items-center justify-center font-mono text-sm text-cream border-x border-edge">
        {item.quantity}
      </span>
      <button
        onClick={() => onUpdateQuantity(item.id, 1)}
        className="w-9 h-9 flex items-center justify-center font-mono text-sm text-stone hover:text-cream hover:bg-surface transition-colors duration-200"
        aria-label={`Increase quantity of ${item.name}`}
      >
        +
      </button>
    </div>

    {/* Line total */}
    <div className="w-28 text-right">
      <span className="font-mono text-lg text-cream">
        ${(item.price * item.quantity).toFixed(2)}
      </span>
    </div>

    {/* Remove */}
    <button
      onClick={() => onRemove(item.id)}
      className="font-mono text-xs text-dim hover:text-rose transition-colors duration-200"
      aria-label={`Remove ${item.name} from cart`}
    >
      &times;
    </button>
  </article>
));

CartItemRow.displayName = "CartItemRow";

// Empty cart state
const EmptyCart = memo(() => (
  <div className="text-center py-24 border border-edge" role="region" aria-label="Empty cart">
    <span className="font-mono text-sm text-dim block mb-4">
      No items in cart
    </span>
    <h3 className="font-display text-3xl italic text-cream mb-3">
      Cart is empty
    </h3>
    <p className="text-stone text-sm mb-8 max-w-md mx-auto">
      Browse the collection to add items to your cart.
    </p>
    <span className="font-mono text-xs tracking-wider text-citrine border border-edge px-6 py-3 inline-block hover:bg-citrine hover:text-noir transition-all duration-300 cursor-pointer">
      Browse Products &rarr;
    </span>
  </div>
));

EmptyCart.displayName = "EmptyCart";

// Order summary
const OrderSummary = memo<{
  total: number;
  itemCount: number;
  onCheckout: () => void;
}>(({ total, itemCount, onCheckout }) => {
  const subtotal = total * 0.9;
  const tax = total * 0.1;

  return (
    <div className="border border-edge p-8">
      <h3 className="font-mono text-[11px] tracking-[0.3em] text-dim uppercase mb-8">
        Order Summary
      </h3>

      <div className="space-y-4 mb-8">
        <div className="flex justify-between font-mono text-sm">
          <span className="text-stone">Subtotal ({itemCount} items)</span>
          <span className="text-cream">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-mono text-sm">
          <span className="text-stone">Shipping</span>
          <span className="text-mint">Free</span>
        </div>
        <div className="flex justify-between font-mono text-sm">
          <span className="text-stone">Tax</span>
          <span className="text-cream">${tax.toFixed(2)}</span>
        </div>
        <div className="border-t border-edge pt-4 flex justify-between">
          <span className="font-mono text-sm text-stone uppercase tracking-wider">
            Total
          </span>
          <span className="font-display text-3xl italic text-cream">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      <button
        onClick={onCheckout}
        className="w-full bg-citrine text-noir font-mono text-sm tracking-wider py-4 hover:bg-citrine-dim transition-colors duration-300"
        aria-label={`Checkout ${itemCount} items for $${total.toFixed(2)}`}
      >
        Checkout &rarr;
      </button>

      <div className="mt-4 flex items-center justify-center gap-3 font-mono text-[10px] text-dim">
        <span>Secure</span>
        <span className="text-edge-bright">&middot;</span>
        <span>30-day returns</span>
      </div>
    </div>
  );
});

OrderSummary.displayName = "OrderSummary";

// Main component
function ShoppingCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { id: 1, name: "MacBook Pro M3", price: 2499.99, quantity: 1 },
    { id: 7, name: "AirPods Pro", price: 249.99, quantity: 2 },
  ]);

  // Listen for addToCart events
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
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  }, []);

  const removeItem = useCallback((id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleCheckout = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent("showNotification", {
        detail: { type: "success", message: "Checkout feature coming soon!" },
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
    <div className="w-full max-w-6xl mx-auto animate-fade-in" role="main">
      {/* Header */}
      <header className="mb-12 animate-fade-in-up">
        <span className="font-mono text-[11px] tracking-[0.3em] text-dim uppercase block mb-3">
          Your Order
        </span>
        <h2 className="font-display text-5xl lg:text-6xl italic text-cream tracking-tight leading-none mb-3">
          Cart
        </h2>
        {cartItems.length > 0 && (
          <p className="text-stone text-sm">
            {itemCount} item{itemCount !== 1 ? "s" : ""} ready for checkout
          </p>
        )}
      </header>

      {cartItems.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Items list */}
          <section className="flex-1 w-full" aria-label="Cart items">
            {/* Column headers */}
            <div className="hidden sm:flex items-center gap-4 pb-3 border-b border-edge mb-2 font-mono text-[10px] tracking-[0.2em] text-dim uppercase">
              <span className="w-16 flex-shrink-0" />
              <span className="flex-1">Product</span>
              <span className="w-[106px]">Qty</span>
              <span className="w-28 text-right">Total</span>
              <span className="w-4" />
            </div>
            <div className="divide-y divide-edge">
              {cartItems.map((item, index) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>
          </section>

          {/* Summary sidebar */}
          <aside className="w-full lg:w-80 lg:sticky lg:top-8">
            <OrderSummary
              total={total}
              itemCount={itemCount}
              onCheckout={handleCheckout}
            />
          </aside>
        </div>
      )}
    </div>
  );
}

ShoppingCart.displayName = "ShoppingCart";

export default ShoppingCart;
