# Products Micro-frontend (Remote) - React 18 Streaming

The **Products micro-frontend** is a standalone application that provides product catalog functionality with **React 18 Suspense streaming** in the Module Federation architecture. It operates as a remote module with enhanced streaming capabilities and visual indicators for conference demonstrations.

## 🎯 Purpose

The Products micro-frontend is responsible for:

- **Streaming Product Catalog**: Displaying products with React 18 Suspense streaming
- **Category Filtering**: Real-time filtering with streaming delays for demonstration
- **Product Details**: Showing detailed product information with skeleton loading
- **Cart Integration**: Enabling users to add products to cart with visual feedback
- **Conference Demo**: Clear streaming indicators showing port 3001 (Blue theme)

## 🏗️ Architecture Role

```
┌─────────────────────────────────────────────────────────┐
│                    Shell App (Host)                     │
│                   localhost:3000                        │
├─────────────────┬─────────────────┬─────────────────────┤
│   Products      │      Cart       │     Dashboard       │
│   localhost:3001│   localhost:3002│    localhost:3003   │
│   (Remote) ⭐    │   (Remote)      │    (Remote)         │
└─────────────────┴─────────────────┴─────────────────────┘
```

As a **Remote Module with Streaming**, the Products micro-frontend:

- Exposes `ProductsCatalog` and `StreamingProductsCatalog` components to the Shell application
- Features React 18 Suspense boundaries with skeleton loading states
- Uses simulated delays to demonstrate streaming capabilities for conferences
- Operates independently with its own build and deployment
- Shares React dependencies with other modules
- Can run standalone for development and testing
- Provides clear visual indicators (Blue theme, Port 3001) for demo purposes

## 📁 File Structure

```
products/
├── package.json                # Dependencies and scripts
├── rspack.config.js           # Module Federation remote configuration
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
├── public/
│   └── index.html             # Standalone development template
└── src/
    ├── index.tsx                    # Entry point for standalone development
    ├── ProductsCatalog.tsx          # Original component (Remote Entry)
    ├── StreamingProductsCatalog.tsx # Streaming version with Suspense
    ├── index.css                    # Component-specific styles
    ├── types.ts                     # Product-related type definitions
    └── lib/
        └── utils.ts                 # Product utility functions
```

## 🔧 Key Configuration Files

### `rspack.config.js` - Module Federation Remote Configuration

```javascript
new rspack.container.ModuleFederationPlugin({
  name: "products",
  filename: "remoteEntry.js",
  exposes: {
    "./ProductsCatalog": "./src/ProductsCatalog.tsx",
    "./StreamingProductsCatalog": "./src/StreamingProductsCatalog.tsx",
  },
  shared: {
    react: { singleton: true, strictVersion: false },
    "react-dom": { singleton: true, strictVersion: false },
  },
});
```

**Key aspects:**

- **name**: Identifies this module as "products"
- **filename**: Entry point for remote consumption
- **exposes**: Makes `ProductsCatalog` and `StreamingProductsCatalog` components available to host apps
- **shared**: Shares React dependencies with Shell application

### `package.json` - Dependencies and Scripts

**Key dependencies:**

- `react` & `react-dom`: UI library (shared with Shell)
- `clsx` & `tailwind-merge`: Conditional styling utilities
- `tailwindcss`: Utility-first CSS framework

**Key scripts:**

- `dev`: Start development server on port 3001
- `build`: Build for production

### `tsconfig.json` - TypeScript Configuration

**Key features:**

- **Strict mode enabled**: Enhanced type checking
- **Path mapping**: Clean imports with `@/`, `@components/`, `@lib/`
- **Module resolution**: Proper handling for Module Federation

## 🧩 Core Components

### `ProductsCatalog.tsx` - Main Exported Component

**Key features:**

- **Product Display**: Grid layout of product cards
- **Category Filtering**: Dynamic filtering by product categories
- **Cart Integration**: Add to cart functionality with event communication
- **Responsive Design**: Mobile-first responsive layout
- **Performance Optimization**: Memoized components and efficient rendering

**Architecture patterns:**

```typescript
// Memoized product card component
const ProductCard = memo<{
  product: Product;
  onAddToCart: (product: Product) => void;
}>(({ product, onAddToCart }) => (
  <div className="product-card">
    <img src={product.image} alt={product.name} />
    <h3>{product.name}</h3>
    <p>{product.price}</p>
    <button onClick={() => onAddToCart(product)}>Add to Cart</button>
  </div>
));

// Filtered products computation
const filteredProducts = useMemo(
  () =>
    products.filter(
      (product) =>
        selectedCategory === "all" || product.category === selectedCategory
    ),
  [products, selectedCategory]
);
```

### `types.ts` - Type Definitions

**Core interfaces:**

```typescript
export interface Product {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly category: ProductCategory;
  readonly image: string;
  readonly description: string;
  readonly inStock: boolean;
}

export type ProductCategory =
  | "electronics"
  | "clothing"
  | "books"
  | "home"
  | "sports";

export interface CartItem {
  readonly product: Product;
  readonly quantity: number;
}
```

### `lib/utils.ts` - Utility Functions

**Key utilities:**

- **Price formatting**: Currency formatting utilities
- **Product filtering**: Filter and search logic
- **Cart operations**: Add to cart helper functions
- **Category management**: Category-related utilities

## 🚀 Development

### Starting the Products Micro-frontend

```bash
# From the products directory
npm run dev

# Or from the root directory
npm run dev:products
```

The application will start on `http://localhost:3001`

### Standalone Development

The Products micro-frontend can run independently for development:

1. **Standalone Mode**: Access `http://localhost:3001` to view the component in isolation
2. **Module Federation Mode**: Consumed by Shell app at `http://localhost:3000`

### Development Features

- **Hot Reloading**: Instant updates with React Refresh
- **Standalone Testing**: Test component functionality in isolation
- **Module Federation Testing**: Test integration with Shell app
- **Type Safety**: Full TypeScript support with strict mode

## 🎨 Product Catalog Features

### Product Display

**Grid Layout:**

- Responsive product grid
- Product images with lazy loading
- Product information (name, price, category)
- Stock status indicators
- Add to cart buttons

**Product Cards:**

```typescript
interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard = memo<ProductCardProps>(({ product, onAddToCart }) => (
  <div className="bg-white rounded-lg shadow-md p-4 transition-transform hover:scale-105">
    <img
      src={product.image}
      alt={product.name}
      className="w-full h-48 object-cover rounded-md mb-4"
    />
    <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
    <p className="text-gray-600 mb-2">{product.description}</p>
    <div className="flex justify-between items-center">
      <span className="text-xl font-bold text-purple-600">
        ${product.price.toFixed(2)}
      </span>
      <button
        onClick={() => onAddToCart(product)}
        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
      >
        Add to Cart
      </button>
    </div>
  </div>
));
```

### Category Filtering

**Filter Interface:**

- Category buttons for easy filtering
- "All" option to show all products
- Active category highlighting
- Product count per category

**Filter Implementation:**

```typescript
const categories: readonly ProductCategory[] = [
  "electronics",
  "clothing",
  "books",
  "home",
  "sports",
] as const;

const CategoryButton = memo<{
  category: string;
  isActive: boolean;
  onClick: (category: string) => void;
}>(({ category, isActive, onClick }) => (
  <button
    onClick={() => onClick(category)}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
      isActive
        ? "bg-purple-600 text-white"
        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
    }`}
  >
    {category.charAt(0).toUpperCase() + category.slice(1)}
  </button>
));
```

### Cart Integration

**Inter-module Communication:**
The Products micro-frontend communicates with the Cart module through custom events:

```typescript
const handleAddToCart = useCallback((product: Product) => {
  const cartItem: CartItem = {
    product,
    quantity: 1,
  };

  // Dispatch custom event for cart integration
  window.dispatchEvent(
    new CustomEvent("addToCart", {
      detail: cartItem,
      bubbles: true,
    })
  );

  // Show success notification
  window.dispatchEvent(
    new CustomEvent("showNotification", {
      detail: {
        type: "success",
        message: `${product.name} added to cart!`,
      },
    })
  );
}, []);
```

## 📊 Data Management

### Product Data Structure

**Sample Product Data:**

```typescript
const sampleProducts: Product[] = [
  {
    id: "1",
    name: "Wireless Headphones",
    price: 99.99,
    category: "electronics",
    image: "/images/headphones.jpg",
    description: "High-quality wireless headphones with noise cancellation",
    inStock: true,
  },
  {
    id: "2",
    name: "Cotton T-Shirt",
    price: 29.99,
    category: "clothing",
    image: "/images/tshirt.jpg",
    description: "Comfortable 100% cotton t-shirt",
    inStock: true,
  },
  // ... more products
];
```

### State Management

**Local State:**

- Selected category filter
- Product search query
- Loading states
- Error states

**State Implementation:**

```typescript
const ProductsCatalog: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [products] = useState<Product[]>(sampleProducts);

  const filteredProducts = useMemo(() =>
    products.filter(product =>
      selectedCategory === "all" || product.category === selectedCategory
    ), [products, selectedCategory]
  );

  return (
    // Component JSX
  );
};
```

## 🎨 Styling and Design

### Tailwind CSS Integration

**Component Styling:**

- Utility-first approach with Tailwind classes
- Responsive design with mobile-first breakpoints
- Consistent color scheme with purple primary
- Hover effects and transitions

**Responsive Grid:**

```css
/* Product grid responsive layout */
.products-grid {
  @apply grid gap-6;
  @apply grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4;
}

/* Product card styling */
.product-card {
  @apply bg-white rounded-lg shadow-md p-4;
  @apply transition-transform hover:scale-105;
  @apply border border-gray-200;
}
```

### Design System

**Color Palette:**

- Primary: Purple (600, 700)
- Secondary: Gray (200, 300, 600, 700)
- Success: Green for stock status
- Background: White with subtle shadows

**Typography:**

- Headers: Bold, readable font sizes
- Body: Clean, accessible text
- Prices: Emphasized with color and weight

## 🔍 Performance Optimization

### React Performance

1. **Memoization**: Components memoized with `React.memo`
2. **Callback Optimization**: Event handlers with `useCallback`
3. **Computed Values**: Filtered products with `useMemo`
4. **Efficient Re-renders**: Optimized dependency arrays

### Bundle Optimization

1. **Code Splitting**: Automatic with Module Federation
2. **Tree Shaking**: Dead code elimination
3. **Image Optimization**: Lazy loading for product images
4. **CSS Optimization**: Tailwind CSS purging

### Development Performance

- **Fast Refresh**: Preserves component state
- **Hot Reloading**: Instant updates
- **Source Maps**: Accurate debugging
- **Build Caching**: Filesystem caching for faster rebuilds

## 🧪 Testing Strategies

### Development Testing

1. **Standalone Testing**: Run micro-frontend in isolation
2. **Integration Testing**: Test with Shell application
3. **Module Federation Testing**: Verify remote loading
4. **Cross-browser Testing**: Ensure compatibility

### Testing Approaches

```bash
# Run standalone for testing
npm run dev

# Test in Shell application
# Start all services and test integration
npm run dev (from root)
```

## 🚀 Production Deployment

### Build Configuration

**Production Optimizations:**

- Minification and compression
- Code splitting for optimal loading
- Asset optimization
- Bundle analysis

### Deployment Strategy

1. **Independent Deployment**: Deploy products module separately
2. **Versioning**: Semantic versioning for module updates
3. **Rollback Strategy**: Quick rollback for issues
4. **Health Checks**: Monitor module availability

### Environment Configuration

```javascript
// Update remote URLs for production
const isProduction = process.env.NODE_ENV === "production";
const remoteUrl = isProduction
  ? "https://products.yourdomain.com/remoteEntry.js"
  : "http://localhost:3001/remoteEntry.js";
```

## 🔗 Integration Points

### With Shell Application

1. **Component Export**: `ProductsCatalog` component exposed
2. **Shared Dependencies**: React shared with Shell
3. **Event Communication**: Custom events for cart integration
4. **Error Handling**: Graceful failure with fallbacks

### With Cart Module

1. **Add to Cart Events**: Custom event communication
2. **Product Data**: Shared product interfaces
3. **State Synchronization**: Cart updates reflected globally

### Communication Example

```typescript
// Type-safe event interface
interface AddToCartEvent extends CustomEvent {
  detail: CartItem;
}

// Event dispatch
const dispatchAddToCart = (cartItem: CartItem) => {
  window.dispatchEvent(
    new CustomEvent<CartItem>("addToCart", {
      detail: cartItem,
      bubbles: true,
    })
  );
};
```

## 🤝 Contributing

When contributing to the Products micro-frontend:

1. **Follow TypeScript strict mode** requirements
2. **Maintain component memoization** for performance
3. **Add proper type definitions** for new features
4. **Test both standalone and integrated** modes
5. **Update product data structures** carefully
6. **Maintain accessibility** standards
7. **Test cart integration** thoroughly

## 📚 API Reference

### Exported Components

**ProductsCatalog**

```typescript
interface ProductsCatalogProps {
  // Optional props for configuration
  initialCategory?: ProductCategory;
  onProductSelect?: (product: Product) => void;
}

const ProductsCatalog: React.FC<ProductsCatalogProps>;
```

### Type Exports

- `Product`: Product data interface
- `ProductCategory`: Category type union
- `CartItem`: Cart item interface

---

The Products micro-frontend provides a comprehensive product catalog experience while maintaining independence and integration capabilities within the Module Federation architecture.
