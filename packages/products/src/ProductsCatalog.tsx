import React, { useState, useCallback, useMemo } from "react";
import { cn } from "./lib/utils";
import { Product, CartItem, FilterCategory } from "./types";

const MOCK_PRODUCTS: readonly Product[] = [
  {
    id: 1,
    name: "Laptop",
    price: 999.99,
    category: "electronics",
    image: "TECH",
    description: "High-performance laptop for work and gaming",
  },
  {
    id: 2,
    name: "T-Shirt",
    price: 19.99,
    category: "clothing",
    image: "SHIRT",
    description: "Comfortable 100% cotton t-shirt",
  },
  {
    id: 3,
    name: "Book",
    price: 12.99,
    category: "books",
    image: "📚",
    description: "New York Times bestselling novel",
  },
  {
    id: 4,
    name: "Phone",
    price: 699.99,
    category: "electronics",
    image: "��",
    description: "Latest smartphone with advanced camera",
  },
  {
    id: 5,
    name: "Jeans",
    price: 49.99,
    category: "clothing",
    image: "👖",
    description: "Premium quality denim jeans",
  },
  {
    id: 6,
    name: "Cookbook",
    price: 24.99,
    category: "books",
    image: "📖",
    description: "Professional cooking techniques and recipes",
  },
] as const;

const CATEGORIES: readonly FilterCategory[] = [
  "all",
  "electronics",
  "clothing",
  "books",
] as const;

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
    <div className="w-full max-w-6xl mx-auto" role="main">
      <header className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl mb-6">
          <span
            className="text-3xl animate-pulse text-white font-bold"
            role="img"
            aria-label="shopping"
          >
            SHOP
          </span>
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Premium Collection
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
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
                  ? "bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-gray-200 shadow-lg shadow-purple-500/25"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
              )}
              aria-pressed={selectedCategory === category}
              aria-label={`Filter by ${category} category`}
            >
              <span className="flex items-center gap-2">
                {category === "all" && "🌟"}
                {category === "electronics" && "⚡"}
                {category === "clothing" && "👔"}
                {category === "books" && "📚"}
                <span>
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
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="group bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-purple-200 relative overflow-hidden"
                role="article"
                aria-label={`Product: ${product.name}`}
              >
                {/* Product badge */}
                <div className="absolute top-4 right-4 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-gray-200 text-xs font-medium rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {product.category}
                </div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-4 group-hover:from-purple-100 group-hover:to-pink-100 transition-all duration-300">
                      <div
                        className="text-3xl transition-transform duration-300 group-hover:scale-110"
                        role="img"
                        aria-label={`${product.name} icon`}
                      >
                        {product.image}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors duration-300">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-left">
                      <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        ${product.price.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Best price guarantee
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="group/btn px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-gray-200 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transform hover:scale-105 shadow-lg hover:shadow-xl relative overflow-hidden"
                      aria-label={`Add ${product.name} to cart`}
                    >
                      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500" />
                      <span className="relative flex items-center gap-2">
                        <span>Add to Cart</span>
                        <span className="transition-transform duration-300 group-hover/btn:translate-x-1">
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
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-6">
              <div className="text-4xl" role="img" aria-hidden="true">
                📭
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-3">
              No products found
            </h3>
            <p className="text-gray-500 text-lg">
              Try selecting a different category to explore our collection
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

ProductsCatalog.displayName = "ProductsCatalog";

export default ProductsCatalog;
