"use client";

import ProductCard from '@/components/products/ProductCard';
import ProductFilters, { ProductFilterState } from '@/components/products/ProductFilters';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

function extractFilterOptions(products: any[]) {
  const colors = new Set<string>();
  const sizes = new Set<string>();
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  for (const product of products) {
    if (typeof product.price === 'number') {
      minPrice = Math.min(minPrice, product.price);
      maxPrice = Math.max(maxPrice, product.price);
    }
    if (product.variants && product.variants.length > 0) {
      for (const v of product.variants) {
        if (v.color) colors.add(v.color);
        if (v.size) sizes.add(v.size);
        if (typeof v.price === 'number') {
          minPrice = Math.min(minPrice, v.price);
          maxPrice = Math.max(maxPrice, v.price);
        }
      }
    }
  }
  return {
    colors: Array.from(colors).filter(Boolean),
    sizes: Array.from(sizes).filter(Boolean),
    minPrice: minPrice === Infinity ? 0 : minPrice,
    maxPrice: maxPrice === -Infinity ? 0 : maxPrice,
  };
}

export default function ProductsPageClient({ products, categories }: { products: any[]; categories: any[] }) {
  const { colors, sizes, minPrice, maxPrice } = extractFilterOptions(products);
  const [filterState, setFilterState] = React.useState<ProductFilterState>({});
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [dragStartY, setDragStartY] = React.useState(0);
  const [currentDragY, setCurrentDragY] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const bottomSheetRef = React.useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
    setCurrentDragY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const dragDistance = currentY - dragStartY;
    
    // Only allow dragging down
    if (dragDistance > 0) {
      setCurrentDragY(currentY);
      if (bottomSheetRef.current) {
        // Remove transition during drag for immediate response
        bottomSheetRef.current.style.transition = 'none';
        bottomSheetRef.current.style.transform = `translateY(${dragDistance}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const dragDistance = currentDragY - dragStartY;
    const threshold = 100; // Dismiss threshold in pixels
    
    if (dragDistance > threshold) {
      // Close the filter with smooth transition
      if (bottomSheetRef.current) {
        bottomSheetRef.current.style.transition = 'transform 500ms ease-in-out';
        bottomSheetRef.current.style.transform = 'translateY(100%)';
        // Wait for transition to complete before updating state
        setTimeout(() => {
          setIsFilterOpen(false);
          // Reset transform style after state update
          if (bottomSheetRef.current) {
            bottomSheetRef.current.style.transition = '';
            bottomSheetRef.current.style.transform = '';
          }
        }, 500);
      }
    } else {
      // Reset position with smooth transition
      if (bottomSheetRef.current) {
        bottomSheetRef.current.style.transition = 'transform 500ms ease-in-out';
        bottomSheetRef.current.style.transform = 'translateY(0)';
        // Reset transition style after animation
        setTimeout(() => {
          if (bottomSheetRef.current) {
            bottomSheetRef.current.style.transition = '';
          }
        }, 500);
      }
    }
    
    // Reset drag state
    setDragStartY(0);
    setCurrentDragY(0);
  };

  // Filtering logic
  const filteredProducts = products.filter((product) => {
    // Category
    if (filterState.category && product.category?._id !== filterState.category) return false;
    // Price
    const price = product.price;
    if (typeof filterState.priceMin === 'number' && price < filterState.priceMin) return false;
    if (typeof filterState.priceMax === 'number' && price > filterState.priceMax) return false;
    // Color
    if (filterState.color) {
      const hasColor = (product.variants || []).some((v: any) => v.color === filterState.color);
      if (!hasColor) return false;
    }
    // Size
    if (filterState.size) {
      const hasSize = (product.variants || []).some((v: any) => v.size === filterState.size);
      if (!hasSize) return false;
    }
    // In Stock
    if (filterState.inStock) {
      const inStock = (product.variants || []).some((v: any) => v.stock > 0) || product.stock > 0;
      if (!inStock) return false;
    }
    return true;
  });

  // Sort logic
  let sortedProducts = [...filteredProducts];
  switch (filterState.sort) {
    case 'price-low':
      sortedProducts.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      sortedProducts.sort((a, b) => b.price - a.price);
      break;
    case 'name':
      sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'newest':
      sortedProducts.sort((a, b) => new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime());
      break;
    default:
      break;
  }

  return (
    <>
      <div className="pt-20 sm:pt-24">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-[#333] mb-2 mt-2 sm:mt-0">Shop All Products</h1>
        <p className="text-base sm:text-lg text-center text-gray-600 mb-6 sm:mb-10">Browse our complete collection and find something for everyone.</p>
        {/* Mobile Filter Button */}
        <div className="lg:hidden sticky top-16 z-30 mb-4">
          <div className="max-w-7xl mx-auto px-2 sm:px-6">
            <div className="flex justify-end mr-4 sm:mr-6">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => setIsFilterOpen(true)}
                className="border-[#42A5F5] text-[#42A5F5] hover:bg-[#42A5F5]/10"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A2 2 0 0013 14.586V19a1 1 0 01-1.447.894l-2-1A1 1 0 019 18v-3.414a2 2 0 00-.586-1.414L2 6.707A1 1 0 012 6V4z" /></svg>
                Show Filters
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Filter Bottom Sheet */}
      <div 
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-500 ${isFilterOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-500"
          onClick={() => setIsFilterOpen(false)}
        />
        {/* Bottom Sheet */}
        <div 
          ref={bottomSheetRef}
          className="fixed inset-x-0 bottom-0 z-50 h-[45%] transform"
          style={{
            transform: isFilterOpen ? 'translateY(0)' : 'translateY(100%)',
            touchAction: 'none',
            transition: isFilterOpen ? 'transform 500ms ease-in-out' : 'none'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative h-full w-full overflow-hidden rounded-t-2xl bg-white shadow-xl">
            {/* Drag Handle - Made larger for better touch target */}
            <div 
              className="absolute left-1/2 top-0 -translate-x-1/2 w-full h-12 flex items-center justify-center cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="h-1 w-12 rounded-full bg-[#42A5F5]/30" />
            </div>
            {/* Close Button */}
            <button
              onClick={() => setIsFilterOpen(false)}
              className="absolute right-4 top-4 text-[#42A5F5] hover:text-[#42A5F5]/80"
              aria-label="Close filters"
            >
              <X className="h-6 w-6" />
            </button>
            {/* Filter Content */}
            <div className="h-full overflow-y-auto px-4 sm:px-6 pt-12 pb-6">
              <h2 className="text-xl font-semibold text-[#333333] mb-6">Filters</h2>
              <div className="max-w-2xl mx-auto">
                <ProductFilters
                  categories={categories}
                  colors={colors}
                  sizes={sizes}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  onChange={setFilterState}
                  filterState={filterState}
                  showCategory={true}
                />
                <div className="sticky bottom-0 mt-6 flex gap-3 bg-white pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-[#42A5F5] text-[#42A5F5] hover:bg-[#42A5F5]/10" 
                    onClick={() => {
                      setFilterState({});
                      setIsFilterOpen(false);
                    }}
                  >
                    Clear All
                  </Button>
                  <Button 
                    className="flex-1 bg-[#FFC300] hover:bg-[#FFC300]/90 text-[#333333] font-semibold" 
                    onClick={() => setIsFilterOpen(false)}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-4 p-2 sm:p-6 mt-4 sm:mt-12">
        {/* Filter Sidebar (Desktop only) */}
        <aside className="hidden lg:block max-w-[260px] bg-white rounded-xl shadow p-6 space-y-6 mb-8 lg:mb-0 self-start">
          <ProductFilters
            categories={categories}
            colors={colors}
            sizes={sizes}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onChange={setFilterState}
            filterState={filterState}
            showCategory={true}
          />
        </aside>
        {/* Product Grid */}
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-2 sm:px-6">
            {sortedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {sortedProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No products found.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 