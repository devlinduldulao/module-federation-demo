# Cart Micro-frontend (Remote) - React 18 Streaming

The **Cart micro-frontend** is a standalone application that provides shopping cart functionality with **React 18 Suspense streaming** in the Module Federation architecture. It operates as a remote module with enhanced streaming capabilities and visual indicators for conference demonstrations.

## 🎯 Purpose

The Cart micro-frontend is responsible for:

- **Streaming Cart Management**: Adding, removing, and updating cart items with streaming delays
- **Real-time Cart State**: Maintaining cart state with streaming updates for demonstration
- **Cart UI with Streaming**: Displaying cart contents with skeleton loading states
- **Checkout Preparation**: Preparing cart data with streaming indicators
- **Conference Demo**: Clear streaming indicators showing port 3002 (Green theme)

## 🏗️ Architecture Role

```
┌─────────────────────────────────────────────────────────┐
│                    Shell App (Host)                     │
│                   localhost:3000                        │
├─────────────────┬─────────────────┬─────────────────────┤
│   Products      │      Cart       │     Dashboard       │
│   localhost:3001│   localhost:3002│    localhost:3003   │
│   (Remote)      │   (Remote) ⭐    │    (Remote)         │
└─────────────────┴─────────────────┴─────────────────────┘
```

As a **Remote Module with Streaming**, the Cart micro-frontend:

- Exposes `ShoppingCart` and `StreamingShoppingCart` components to the Shell application
- Features React 18 Suspense boundaries with skeleton loading states
- Uses simulated delays to demonstrate real-time cart updates for conferences
- Listens for "addToCart" events from Products module with streaming feedback
- Manages cart state independently with streaming indicators
- Provides cart summary and management with visual streaming feedback
- Can run standalone for development and testing
- Provides clear visual indicators (Green theme, Port 3002) for demo purposes

## 📁 File Structure

```
cart/
├── package.json                # Dependencies and scripts
├── rspack.config.js           # Module Federation remote configuration
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
├── public/
│   └── index.html             # Standalone development template
└── src/
    ├── index.tsx                   # Entry point for standalone development
    ├── ShoppingCart.tsx            # Original component (Remote Entry)
    ├── StreamingShoppingCart.tsx   # Streaming version with Suspense
    ├── index.css                   # Component-specific styles
    ├── types.ts                    # Cart-related type definitions
    └── lib/
        └── utils.ts                # Cart utility functions
```

## 🔧 Key Configuration Files

### `rspack.config.js` - Module Federation Remote Configuration

```javascript
new rspack.container.ModuleFederationPlugin({
  name: "cart",
  filename: "remoteEntry.js",
  exposes: {
    "./ShoppingCart": "./src/ShoppingCart.tsx",
    "./StreamingShoppingCart": "./src/StreamingShoppingCart.tsx",
  },
  shared: {
    react: { singleton: true, strictVersion: false },
    "react-dom": { singleton: true, strictVersion: false },
  },
});
```

**Key aspects:**

- **name**: Identifies this module as "cart"
- **filename**: Entry point for remote consumption
- **exposes**: Makes `ShoppingCart` and `StreamingShoppingCart` components available to host apps
- **shared**: Shares React dependencies with Shell application

### `package.json` - Dependencies and Scripts

**Key dependencies:**

- `react` & `react-dom`: UI library (shared with Shell)
- `clsx` & `tailwind-merge`: Conditional styling utilities
- `tailwindcss`: Utility-first CSS framework

**Key scripts:**

- `dev`: Start development server on port 3002
- `build`: Build for production

### `tsconfig.json` - TypeScript Configuration

**Key features:**

- **Strict mode enabled**: Enhanced type checking
- **Path mapping**: Clean imports with `@/`, `@components/`, `@lib/`
- **Module resolution**: Proper handling for Module Federation

## 🧩 Core Components

### `ShoppingCart.tsx` - Main Exported Component

**Key features:**

- **Cart Display**: List of cart items with details
- **Item Management**: Add, remove, update quantity functionality
- **Cart Summary**: Total price, item count, tax calculation
- **Event Handling**: Listens for "addToCart" events from other modules
- **Empty State**: Elegant empty cart experience
- **Performance Optimization**: Memoized components and efficient rendering

**Architecture patterns:**

```typescript
// Memoized cart item component
const CartItemCard = memo<{
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}>(({ item, onUpdateQuantity, onRemove }) => (
  <div className="cart-item">
    <img src={item.product.image} alt={item.product.name} />
    <div className="item-details">
      <h3>{item.product.name}</h3>
      <p>${item.product.price}</p>
      <QuantityControl
        quantity={item.quantity}
        onUpdate={(qty) => onUpdateQuantity(item.product.id, qty)}
      />
    </div>
    <button onClick={() => onRemove(item.product.id)}>Remove</button>
  </div>
));

// Cart totals calculation
const cartTotal = useMemo(
  () =>
    cartItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    ),
  [cartItems]
);
```

### `types.ts` - Type Definitions

**Core interfaces:**

```typescript
export interface CartItem {
  readonly product: Product;
  readonly quantity: number;
  readonly addedAt: Date;
}

export interface CartSummary {
  readonly itemCount: number;
  readonly subtotal: number;
  readonly tax: number;
  readonly total: number;
}

export interface CartState {
  readonly items: CartItem[];
  readonly summary: CartSummary;
  readonly isLoading: boolean;
  readonly lastUpdated: Date;
}

// Event interfaces for type-safe communication
export interface AddToCartEvent extends CustomEvent {
  detail: {
    product: Product;
    quantity?: number;
  };
}

export interface CartUpdateEvent extends CustomEvent {
  detail: {
    type: "add" | "remove" | "update" | "clear";
    item?: CartItem;
    quantity?: number;
  };
}
```

### `lib/utils.ts` - Utility Functions

**Key utilities:**

- **Cart calculations**: Price totals, tax, item counts
- **Item operations**: Add, remove, update cart items
- **Storage utilities**: Local storage persistence
- **Validation**: Cart item validation

```typescript
// Cart calculation utilities
export const calculateCartSummary = (items: CartItem[]): CartSummary => {
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  const subtotal = items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
  const tax = subtotal * 0.08; // 8% tax rate
  const total = subtotal + tax;

  return { itemCount, subtotal, tax, total };
};

// Storage utilities
export const saveCartToStorage = (items: CartItem[]) => {
  localStorage.setItem("cart", JSON.stringify(items));
};

export const loadCartFromStorage = (): CartItem[] => {
  const stored = localStorage.getItem("cart");
  return stored ? JSON.parse(stored) : [];
};
```

## 🚀 Development

### Starting the Cart Micro-frontend

```bash
# From the cart directory
npm run dev

# Or from the root directory
npm run dev:cart
```

The application will start on `http://localhost:3002`

### Standalone Development

The Cart micro-frontend can run independently for development:

1. **Standalone Mode**: Access `http://localhost:3002` to view the component with mock data
2. **Module Federation Mode**: Consumed by Shell app at `http://localhost:3000`

### Development Features

- **Hot Reloading**: Instant updates with React Refresh
- **Mock Data**: Test cart functionality with sample items
- **Event Simulation**: Test event handling in isolation
- **Type Safety**: Full TypeScript support with strict mode

## 🛒 Shopping Cart Features

### Cart Item Management

**Item Display:**

- Product image and details
- Quantity controls with validation
- Price per item and total per item
- Remove item functionality
- Last added timestamp

**Quantity Controls:**

```typescript
const QuantityControl = memo<{
  quantity: number;
  onUpdate: (quantity: number) => void;
  min?: number;
  max?: number;
}>(({ quantity, onUpdate, min = 1, max = 99 }) => (
  <div className="flex items-center space-x-2">
    <button
      onClick={() => onUpdate(Math.max(min, quantity - 1))}
      disabled={quantity <= min}
      className="w-8 h-8 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
    >
      -
    </button>
    <span className="w-12 text-center font-medium">{quantity}</span>
    <button
      onClick={() => onUpdate(Math.min(max, quantity + 1))}
      disabled={quantity >= max}
      className="w-8 h-8 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
    >
      +
    </button>
  </div>
));
```

### Cart Summary

**Summary Components:**

- **Item Count**: Total number of items
- **Subtotal**: Sum of all item prices
- **Tax Calculation**: Configurable tax rate
- **Total**: Final amount including tax
- **Savings**: Discounts and promotions (future)

**Summary Implementation:**

```typescript
const CartSummary = memo<{ summary: CartSummary }>(({ summary }) => (
  <div className="bg-gray-50 p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>Items ({summary.itemCount})</span>
        <span>${summary.subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span>Tax</span>
        <span>${summary.tax.toFixed(2)}</span>
      </div>
      <div className="border-t pt-2 flex justify-between font-semibold text-lg">
        <span>Total</span>
        <span className="text-purple-600">${summary.total.toFixed(2)}</span>
      </div>
    </div>
    <button className="w-full mt-4 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors">
      Proceed to Checkout
    </button>
  </div>
));
```

### Empty Cart State

**Empty State Features:**

- Friendly empty cart message
- Call-to-action to browse products
- Suggested actions
- Consistent styling

```typescript
const EmptyCart = memo(() => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">🛒</div>
    <h3 className="text-xl font-semibold text-gray-800 mb-2">
      Your cart is empty
    </h3>
    <p className="text-gray-600 mb-6">Add some products to get started!</p>
    <button
      onClick={() =>
        window.dispatchEvent(new CustomEvent("navigateToProducts"))
      }
      className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
    >
      Browse Products
    </button>
  </div>
));
```

## 📊 State Management

### Cart State Structure

**Local State Management:**

```typescript
const useCartState = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const cartSummary = useMemo(
    () => calculateCartSummary(cartItems),
    [cartItems]
  );

  const addItem = useCallback((product: Product, quantity = 1) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product.id === product.id
      );

      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [
          ...prevItems,
          {
            product,
            quantity,
            addedAt: new Date(),
          },
        ];
      }
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.product.id !== productId)
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }

      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    },
    [removeItem]
  );

  return {
    cartItems,
    cartSummary,
    isLoading,
    addItem,
    removeItem,
    updateQuantity,
  };
};
```

### Persistence

**Local Storage Integration:**

```typescript
// Save cart state to localStorage
useEffect(() => {
  saveCartToStorage(cartItems);
}, [cartItems]);

// Load cart state on mount
useEffect(() => {
  const savedItems = loadCartFromStorage();
  setCartItems(savedItems);
}, []);
```

## 🔗 Inter-Module Communication

### Event Handling

**Listening for Add to Cart Events:**

```typescript
useEffect(() => {
  const handleAddToCart = (event: AddToCartEvent) => {
    const { product, quantity = 1 } = event.detail;
    addItem(product, quantity);

    // Dispatch cart update event
    window.dispatchEvent(
      new CustomEvent("cartUpdated", {
        detail: {
          type: "add",
          item: { product, quantity, addedAt: new Date() },
        },
      })
    );
  };

  window.addEventListener("addToCart", handleAddToCart);

  return () => {
    window.removeEventListener("addToCart", handleAddToCart);
  };
}, [addItem]);
```

### Global Cart Updates

**Broadcasting Cart Changes:**

```typescript
const dispatchCartUpdate = useCallback(
  (
    type: "add" | "remove" | "update" | "clear",
    item?: CartItem,
    quantity?: number
  ) => {
    window.dispatchEvent(
      new CustomEvent("cartUpdated", {
        detail: { type, item, quantity },
        bubbles: true,
      })
    );
  },
  []
);
```

## 🎨 Styling and Design

### Tailwind CSS Integration

**Component Styling:**

- Consistent cart item layout
- Responsive design for mobile devices
- Smooth transitions and hover effects
- Accessible form controls

**Cart Layout:**

```css
/* Cart container */
.cart-container {
  @apply max-w-4xl mx-auto p-6;
}

/* Cart item card */
.cart-item {
  @apply bg-white p-4 rounded-lg shadow-md border border-gray-200;
  @apply flex items-center space-x-4;
  @apply transition-all hover:shadow-lg;
}

/* Quantity controls */
.quantity-control {
  @apply flex items-center space-x-2;
}

.quantity-button {
  @apply w-8 h-8 rounded-md bg-gray-200 hover:bg-gray-300;
  @apply flex items-center justify-center;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}
```

### Responsive Design

**Mobile-First Approach:**

- Stacked layout on mobile devices
- Touch-friendly quantity controls
- Optimized cart summary layout
- Accessible navigation and actions

## 🔍 Performance Optimization

### React Performance

1. **Memoization**: All components memoized with `React.memo`
2. **Callback Optimization**: Event handlers with `useCallback`
3. **Computed Values**: Cart calculations with `useMemo`
4. **Efficient Updates**: Optimized state updates

### Memory Management

1. **Event Cleanup**: Proper event listener cleanup
2. **State Optimization**: Minimal re-renders
3. **Storage Management**: Efficient localStorage usage

### Bundle Optimization

1. **Code Splitting**: Automatic with Module Federation
2. **Tree Shaking**: Dead code elimination
3. **Asset Optimization**: Optimized images and styles

## 🧪 Testing Strategies

### Standalone Testing

**Mock Data Testing:**

```typescript
const mockCartItems: CartItem[] = [
  {
    product: {
      id: "1",
      name: "Test Product",
      price: 29.99,
      category: "electronics",
      image: "/test-image.jpg",
      description: "Test description",
      inStock: true,
    },
    quantity: 2,
    addedAt: new Date(),
  },
];
```

### Integration Testing

1. **Event Communication**: Test addToCart events
2. **State Synchronization**: Verify cart updates
3. **Cross-Module Integration**: Test with Products module
4. **Persistence Testing**: Verify localStorage functionality

## 🚀 Production Deployment

### Build Configuration

**Production Features:**

- Optimized bundle size
- Asset compression
- Code splitting
- Performance monitoring

### Deployment Considerations

1. **Independent Deployment**: Deploy cart module separately
2. **State Migration**: Handle cart data across deployments
3. **Backward Compatibility**: Maintain API compatibility
4. **Performance Monitoring**: Track cart performance metrics

## 🔄 Future Enhancements

### Planned Features

1. **Cart Persistence**: Cloud-based cart synchronization
2. **Promotions**: Discount codes and promotions
3. **Saved for Later**: Wishlist functionality
4. **Quick Actions**: Bulk operations
5. **Analytics**: Cart abandonment tracking

### Technical Improvements

1. **State Management**: Consider Redux for complex state
2. **Optimistic Updates**: Improve user experience
3. **Error Handling**: Enhanced error recovery
4. **Performance**: Further optimization

## 🤝 Contributing

When contributing to the Cart micro-frontend:

1. **Follow TypeScript strict mode** requirements
2. **Maintain performance optimizations** with memoization
3. **Test event communication** thoroughly
4. **Handle edge cases** in cart operations
5. **Maintain accessibility** standards
6. **Test persistence** functionality
7. **Update type definitions** for new features

## 📚 API Reference

### Exported Components

**ShoppingCart**

```typescript
interface ShoppingCartProps {
  // Optional props for configuration
  initialItems?: CartItem[];
  onCheckout?: (items: CartItem[]) => void;
  showSummary?: boolean;
}

const ShoppingCart: React.FC<ShoppingCartProps>;
```

### Event Interfaces

**Listening Events:**

- `addToCart`: Add product to cart
- `clearCart`: Clear all cart items

**Dispatched Events:**

- `cartUpdated`: Cart state changed
- `checkoutRequested`: Checkout initiated

---

The Cart micro-frontend provides comprehensive shopping cart functionality while maintaining independence and seamless integration within the Module Federation architecture.
