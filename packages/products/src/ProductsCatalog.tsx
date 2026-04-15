import { useState, useCallback, useMemo, memo } from "react";
import { cn } from "./lib/utils";
import { Product, CartItem, FilterCategory } from "./types";
import { useActiveTheme } from "./lib/theme";

const MOCK_PRODUCTS: readonly Product[] = [
  {
    id: 1,
    name: "MacBook Pro M3",
    price: 2499.99,
    category: "electronics",
    image: "TECH",
    description: "Revolutionary performance with M3 chip. Perfect for developers and creators.",
  },
  {
    id: 2,
    name: "Designer Hoodie",
    price: 89.99,
    category: "clothing",
    image: "HOODIE",
    description: "Premium organic cotton hoodie with modern minimalist design.",
  },
  {
    id: 3,
    name: "Clean Code",
    price: 45.99,
    category: "books",
    image: "BOOK",
    description: "Robert C. Martin's masterpiece on writing maintainable software.",
  },
  {
    id: 4,
    name: "iPhone 15 Pro",
    price: 1199.99,
    category: "electronics",
    image: "PHONE",
    description: "Titanium design with advanced camera system and A17 Pro chip.",
  },
  {
    id: 5,
    name: "Denim Jacket",
    price: 129.99,
    category: "clothing",
    image: "DENIM",
    description: "Vintage-inspired denim jacket crafted from sustainable materials.",
  },
  {
    id: 6,
    name: "System Design",
    price: 59.99,
    category: "books",
    image: "DESIGN",
    description: "Learn how to design large-scale distributed systems like a pro.",
  },
  {
    id: 7,
    name: "AirPods Pro",
    price: 249.99,
    category: "electronics",
    image: "AUDIO",
    description: "Adaptive Audio with Transparency and Active Noise Cancellation.",
  },
  {
    id: 8,
    name: "Cargo Pants",
    price: 79.99,
    category: "clothing",
    image: "CARGO",
    description: "Technical cargo pants with multiple pockets and water resistance.",
  },
] as const;

const CATEGORIES: readonly FilterCategory[] = [
  "all",
  "electronics",
  "clothing",
  "books",
] as const;

// Product card component
const ProductCard = memo<{
  product: Product;
  index: number;
  onAddToCart: (product: Product) => void;
}>(({ product, index, onAddToCart }) => (
  <article
    className="group bg-noir flex flex-col animate-fade-in-up"
    style={{ animationDelay: `${index * 80}ms` }}
    role="article"
    aria-label={`Product: ${product.name}`}
  >
    {/* Image placeholder */}
    <div className="aspect-square bg-elevated relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-sm text-dim tracking-wider">
          {product.image}
        </span>
      </div>
      {/* Citrine reveal line */}
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-citrine scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </div>

    <div className="p-5 flex flex-col flex-1">
      <span className="font-mono text-[10px] tracking-[0.2em] text-dim uppercase mb-2">
        {product.category}
      </span>
      <h3 className="font-display text-lg italic text-cream mb-1 group-hover:text-citrine transition-colors duration-300">
        {product.name}
      </h3>
      <p className="text-stone text-sm leading-relaxed line-clamp-2 mb-4 flex-1">
        {product.description}
      </p>

      <div className="flex items-end justify-between pt-4 border-t border-edge">
        <span className="font-mono text-xl text-cream tracking-tight">
          ${product.price.toLocaleString()}
        </span>
        <button
          onClick={() => onAddToCart(product)}
          className="font-mono text-xs tracking-wider text-citrine border border-edge px-4 py-2 hover:bg-citrine hover:text-ink transition-all duration-300"
          aria-label={`Add ${product.name} to cart`}
        >
          Add &rarr;
        </button>
      </div>
    </div>
  </article>
));

ProductCard.displayName = "ProductCard";

function ProductsCatalog() {
  const [selectedCategory, setSelectedCategory] =
    useState<FilterCategory>("all");
  const { label: themeLabel } = useActiveTheme();

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
    <div className="w-full mx-auto animate-fade-in" role="main">
      {/* Header */}
      <header className="mb-16 lg:mb-24 animate-fade-in-up">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="font-mono text-[11px] tracking-[0.3em] text-dim uppercase block mb-3">
              Browse Collection
            </span>
            <h2 className="font-display text-5xl lg:text-6xl italic text-cream tracking-tight leading-none mb-3">
              Products
            </h2>
            <p className="text-stone text-sm max-w-xl">
              Curated products for developers, designers, and tech enthusiasts.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start lg:self-auto">
            <span className="font-mono text-[10px] tracking-[0.3em] text-dim uppercase">
              Theme
            </span>
            <span className="border border-edge bg-surface/70 px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-stone uppercase">
              {themeLabel}
            </span>
          </div>
        </div>
      </header>

      {/* Filters */}
      <nav
        className="flex items-center gap-6 mb-10 border-b border-edge pb-4 animate-fade-in-up"
        style={{ animationDelay: "100ms" }}
        role="navigation"
        aria-label="Product category filters"
      >
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            className={cn(
              "font-mono text-xs tracking-wider uppercase pb-2 transition-all duration-300 relative",
              selectedCategory === category
                ? "text-cream"
                : "text-dim hover:text-stone"
            )}
            aria-pressed={selectedCategory === category}
          >
            {category}
            {selectedCategory === category && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-citrine" />
            )}
          </button>
        ))}
        <span className="ml-auto font-mono text-[11px] text-dim">
          {filteredProducts.length} item{filteredProducts.length !== 1 ? "s" : ""}
        </span>
      </nav>

      {/* Product grid */}
      <section aria-label="Products grid">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
            {filteredProducts.map((product, index) => (
              <div key={product.id} className="bg-edge p-px">
                <ProductCard
                  product={product}
                  index={index}
                  onAddToCart={handleAddToCart}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 border border-edge">
            <span className="font-mono text-sm text-dim block mb-3">
              No results
            </span>
            <h3 className="font-display text-2xl italic text-cream mb-2">
              Nothing found
            </h3>
            <p className="text-stone text-sm">
              Try selecting a different category
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

ProductsCatalog.displayName = "ProductsCatalog";

export default ProductsCatalog;
