import { useState, useCallback, useMemo, useEffect } from "react";
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
    if (event.detail.newModule === "products") {
      currentResourceKey = `products-${Date.now()}`;
      // Clear only products resources to force fresh load
      Array.from(resourceCache.keys())
        .filter((key) => key.startsWith("products-"))
        .forEach((key) => resourceCache.delete(key));
    }
  });
}
*/

// Modern Suspense component following React 18+ best practices
const StreamingProductsCatalog = () => {
  // Read from resource - this will throw promise if not ready
  const resource = getResource(currentResourceKey, 2500);
  resource.read(); // Throws promise for Suspense if not ready

  return <ProductsCatalog />;
};

function ProductsCatalog(): JSX.Element {
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
            message: `${product.name} added to cart!`,
          },
        })
      );
    } catch (error) {
      console.error("Failed to add item to cart:", error);
    }
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in-up" role="main">
      <header className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl mb-6 animate-bounce">
          <span className="text-gray-200 font-bold text-lg">SHOP</span>
        </div>
        <h2 className="text-4xl font-bold text-black mb-4">
          Premium Collection
        </h2>
        <p className="text-black text-lg max-w-2xl mx-auto mb-8 font-bold">
          Curated products for developers, designers, and tech enthusiasts.
          Every item tells a story of innovation and quality.
        </p>

        <nav
          className="flex flex-wrap justify-center gap-3"
          role="navigation"
          aria-label="Product category filters"
        >
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={cn(
                "px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transform hover:scale-105",
                selectedCategory === category
                  ? "bg-black text-gray-200 shadow-xl border-4 border-purple-500"
                  : "bg-white text-black hover:bg-gray-100 hover:shadow-md border-4 border-black shadow-sm"
              )}
              aria-pressed={selectedCategory === category}
              aria-label={`Filter by ${category} category`}
            >
              <span className="flex items-center gap-2">
                {category === "all" && (
                  <span className="text-lg font-bold">ALL</span>
                )}
                {category === "electronics" && (
                  <span className="text-lg font-bold">ELEC</span>
                )}
                {category === "clothing" && (
                  <span className="text-lg font-bold">CLOTH</span>
                )}
                {category === "books" && (
                  <span className="text-lg font-bold">BOOK</span>
                )}
                <span
                  className={cn(
                    "font-black",
                    selectedCategory === category
                      ? "text-gray-400"
                      : "text-black"
                  )}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
              </span>
            </button>
          ))}
        </nav>
      </header>

      <section aria-label="Products grid">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product, index) => (
              <article
                key={product.id}
                className="group bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 shadow-md hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-purple-300 hover:bg-white relative overflow-hidden animate-slide-in-right"
                style={{ animationDelay: `${index * 100}ms` }}
                role="article"
                aria-label={`Product: ${product.name}`}
              >
                {/* Product badge */}
                <div className="absolute top-4 right-4 px-3 py-2 bg-black text-gray-200 text-xs font-bold rounded-full opacity-90 group-hover:opacity-100 group-hover:bg-purple-700 transition-all duration-300 shadow-xl border-2 border-gray-200">
                  {product.category.toUpperCase()}
                </div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-200 border-2 border-slate-300 rounded-2xl mb-4 group-hover:bg-purple-100 group-hover:border-purple-300 transition-all duration-300">
                      <span className="text-black text-xs font-bold tracking-wide">
                        IMG
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-black mb-3 group-hover:text-black transition-colors duration-300">
                      {product.name}
                    </h3>
                    <p className="text-black text-sm leading-relaxed line-clamp-2 font-bold">
                      {product.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-left">
                      <div className="text-2xl font-bold text-black">
                        ${product.price.toLocaleString()}
                      </div>
                      <div className="inline-block px-3 py-2 bg-white text-black text-xs font-black rounded-lg border-4 border-black shadow-md">
                        ✓ Best price guarantee
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="group/btn px-6 py-4 bg-white text-black hover:bg-gray-100 transition-all duration-300 text-sm font-black focus:outline-hidden focus:ring-4 focus:ring-black focus:ring-offset-2 transform hover:scale-105 shadow-xl hover:shadow-2xl rounded-xl border-4 border-black relative overflow-hidden"
                      aria-label={`Add ${product.name} to cart`}
                    >
                      <div className="absolute inset-0 bg-black/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500" />
                      <span className="relative flex items-center gap-3 font-black text-base text-black">
                        <span>Add to Cart</span>
                        <span className="transition-transform duration-300 group-hover/btn:translate-x-1 text-lg text-black">
                          →
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-slate-200 border-2 border-slate-300 rounded-3xl mb-6">
              <span className="text-black font-bold text-sm">NO ITEMS</span>
            </div>
            <h3 className="text-2xl font-bold text-black mb-3">
              No products found
            </h3>
            <p className="text-black text-lg font-bold">
              Try selecting a different category to explore our collection
            </p>
          </div>
        )}
      </section>

      {/* Module boundary indicator for conference demo */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-black rounded-full text-black text-sm font-bold shadow-md">
          <span className="w-2 h-2 bg-black rounded-full animate-pulse" />
          <span>
            Products Micro-Frontend • Port 3001 • Independently Deployed
          </span>
        </div>
      </div>
    </div>
  );
}

ProductsCatalog.displayName = "ProductsCatalog";

// Export the streaming wrapper as default for Suspense
export default StreamingProductsCatalog;
