import { useState, useCallback, useMemo } from "react";
import { cn } from "./lib/utils";
import { Product, CartItem, FilterCategory } from "./types";

// Simulate network delay for demonstration
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Enhanced mock data for conference demo
const MOCK_PRODUCTS: readonly Product[] = [
  {
    id: 1,
    name: "MacBook Pro M3",
    price: 2499.99,
    category: "electronics",
    image: "",
    description:
      "Revolutionary performance with M3 chip. Perfect for developers and creators.",
  },
  {
    id: 2,
    name: "Designer Hoodie",
    price: 89.99,
    category: "clothing",
    image: "",
    description: "Premium organic cotton hoodie with modern minimalist design.",
  },
  {
    id: 3,
    name: "Clean Code",
    price: 45.99,
    category: "books",
    image: "",
    description:
      "Robert C. Martin's masterpiece on writing maintainable software.",
  },
  {
    id: 4,
    name: "iPhone 15 Pro",
    price: 1199.99,
    category: "electronics",
    image: "",
    description:
      "Titanium design with advanced camera system and A17 Pro chip.",
  },
  {
    id: 5,
    name: "Denim Jacket",
    price: 129.99,
    category: "clothing",
    image: "",
    description:
      "Vintage-inspired denim jacket crafted from sustainable materials.",
  },
  {
    id: 6,
    name: "System Design",
    price: 59.99,
    category: "books",
    image: "",
    description:
      "Learn how to design large-scale distributed systems like a pro.",
  },
  {
    id: 7,
    name: "AirPods Pro",
    price: 249.99,
    category: "electronics",
    image: "",
    description:
      "Adaptive Audio with Transparency and Active Noise Cancellation.",
  },
  {
    id: 8,
    name: "Cargo Pants",
    price: 79.99,
    category: "clothing",
    image: "",
    description:
      "Technical cargo pants with multiple pockets and water resistance.",
  },
] as const;

const CATEGORIES: readonly FilterCategory[] = [
  "all",
  "electronics",
  "clothing",
  "books",
] as const;

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
let currentResourceKey = "products-initial";

// Modern Suspense component following React 18+ best practices
const StreamingProductsCatalog = () => {
  const resource = getResource(currentResourceKey, 2500);
  resource.read();
  return <ProductsCatalog />;
};

function ProductsCatalog() {
  const [selectedCategory, setSelectedCategory] =
    useState<FilterCategory>("all");

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter(
      (product) =>
        selectedCategory === "all" || product.category === selectedCategory
    );
  }, [selectedCategory]);

  const handleCategoryChange = useCallback((category: FilterCategory) => {
    setSelectedCategory(category);
  }, []);

  const handleAddToCart = useCallback((product: Product) => {
    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    };

    try {
      window.dispatchEvent(
        new CustomEvent("addToCart", {
          detail: cartItem,
          bubbles: true,
        })
      );

      window.dispatchEvent(
        new CustomEvent("showNotification", {
          detail: {
            type: "success",
            message: `${product.name} added to cart`,
          },
        })
      );
    } catch (error) {
      console.error("Failed to add item to cart:", error);
    }
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto" role="main">
      {/* Header — editorial style */}
      <header className="mb-14 animate-fade-in-up">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="font-mono text-[11px] tracking-[0.3em] text-dim uppercase block mb-3">
              Curated Selection
            </span>
            <h2 className="font-display text-5xl lg:text-6xl italic text-cream tracking-tight leading-none">
              Premium Collection
            </h2>
          </div>
          <span className="font-mono text-sm text-dim hidden lg:block">
            {filteredProducts.length} items
          </span>
        </div>

        {/* Filter divider bar */}
        <nav
          className="flex items-center gap-6 border-t border-b border-edge py-4"
          role="navigation"
          aria-label="Product category filters"
        >
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={cn(
                "font-mono text-xs tracking-wider uppercase transition-all duration-300 focus:outline-hidden relative pb-0.5",
                selectedCategory === category
                  ? "text-citrine"
                  : "text-dim hover:text-stone"
              )}
              aria-pressed={selectedCategory === category}
              aria-label={`Filter by ${category}`}
            >
              {category}
              {selectedCategory === category && (
                <span className="absolute -bottom-[17px] left-0 w-full h-[1px] bg-citrine" />
              )}
            </button>
          ))}
        </nav>
      </header>

      {/* Product grid — 1px gap grid creates sharp editorial lines */}
      <section aria-label="Products grid">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[1px] bg-edge">
            {filteredProducts.map((product, index) => (
              <article
                key={product.id}
                className="group bg-noir p-6 transition-all duration-500 hover:bg-surface relative animate-fade-in-up"
                style={{ animationDelay: `${index * 80}ms` }}
                role="article"
                aria-label={`Product: ${product.name}`}
              >
                {/* Image placeholder — geometric */}
                <div className="aspect-square bg-surface mb-5 relative overflow-hidden group-hover:bg-elevated transition-colors duration-500">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-[10px] tracking-wider text-dim group-hover:text-stone transition-colors">
                      {product.category.toUpperCase().slice(0, 4)}
                    </span>
                  </div>
                  {/* Hover reveal line */}
                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-citrine transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                </div>

                {/* Category label */}
                <span className="font-mono text-[10px] tracking-[0.2em] text-dim uppercase block mb-2">
                  {product.category}
                </span>

                {/* Product name — serif */}
                <h3 className="font-display text-xl italic text-cream mb-2 group-hover:text-citrine transition-colors duration-300">
                  {product.name}
                </h3>

                {/* Description */}
                <p className="text-stone text-sm leading-relaxed line-clamp-2 mb-5">
                  {product.description}
                </p>

                {/* Price + CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-edge">
                  <span className="font-mono text-lg text-cream tracking-tight">
                    ${product.price.toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="group/btn px-4 py-2 bg-transparent border border-edge text-stone font-mono text-[11px] tracking-wider uppercase hover:border-citrine hover:text-citrine hover:bg-citrine/5 transition-all duration-300 focus:outline-hidden relative overflow-hidden"
                    aria-label={`Add ${product.name} to cart`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <span>Add</span>
                      <span className="transition-transform duration-300 group-hover/btn:translate-x-1">
                        &rarr;
                      </span>
                    </span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 animate-fade-in-up">
            <div className="w-16 h-16 border border-edge mx-auto mb-6 flex items-center justify-center">
              <span className="font-mono text-[10px] text-dim">EMPTY</span>
            </div>
            <h3 className="font-display text-2xl italic text-cream mb-3">
              No products found
            </h3>
            <p className="text-stone text-sm">
              Try selecting a different category
            </p>
          </div>
        )}
      </section>

      {/* Module boundary indicator */}
      <div className="mt-12 pt-6 border-t border-edge animate-fade-in-up" style={{ animationDelay: "600ms" }}>
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-citrine animate-subtle-pulse" />
          <span className="font-mono text-[11px] tracking-wider text-dim">
            PRODUCTS MICRO-FRONTEND &middot; PORT 3001 &middot; INDEPENDENTLY DEPLOYED
          </span>
        </div>
      </div>
    </div>
  );
}

ProductsCatalog.displayName = "ProductsCatalog";

export default StreamingProductsCatalog;
