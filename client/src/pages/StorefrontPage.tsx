import React, { useState, useEffect } from 'react';
import { Product, Category } from '../types';
import { HeroConcierge } from '../components/storefront/HeroConcierge';
import { ProductCard } from '../components/storefront/ProductCard';
import { ProductDetailModal } from '../components/storefront/ProductDetailModal';
import { Sparkles, CheckCircle2, ArrowRight, Filter, Search, RotateCcw } from 'lucide-react';

interface StorefrontPageProps {
  onNavigateToTrack: (orderNumber: string) => void;
  searchQuery?: string;
  confirmedOrderNumber?: string | null;
  onClearOrderSuccess?: () => void;
}

export const StorefrontPage: React.FC<StorefrontPageProps> = ({
  onNavigateToTrack,
  searchQuery,
  confirmedOrderNumber,
  onClearOrderSuccess
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch categories and products
  useEffect(() => {
    fetch('/api/products/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch((err) => console.error(err));
  }, []);

  const fetchProducts = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.append('category', selectedCategory);
    if (selectedOccasion !== 'all') params.append('occasion', selectedOccasion);
    if (sortBy) params.append('sortBy', sortBy);
    if (searchQuery) params.append('search', searchQuery);

    fetch(`/api/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedOccasion, sortBy, searchQuery]);

  const handleConciergeMatch = (occasion: string, budget: string) => {
    setSelectedOccasion(occasion);
    if (budget === 'under2500') {
      setSortBy('price_asc');
    } else if (budget === 'over4000') {
      setSortBy('price_desc');
    }
    // Smooth scroll to catalog
    const catalogEl = document.getElementById('catalog-section');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedOccasion('all');
    setSortBy('featured');
  };

  const occasionOptions = [
    'All Occasions',
    'Romance',
    'Birthday',
    'Anniversary',
    'Sympathy',
    'Luxury Gifting',
    'Celebration'
  ];

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Hero Concierge: High Attention Grabber */}
      <HeroConcierge onFindMatch={handleConciergeMatch} />

      {/* Confirmed Order Success Notification Modal / Banner */}
      {confirmedOrderNumber && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-5 border border-neutral-200/80">
            <div className="w-14 h-14 rounded-full bg-neutral-100 text-[#1d1d1f] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
                Order Confirmed & Payment Received
              </span>
              <h3 className="font-sans text-2xl font-semibold text-[#1d1d1f] mt-1">
                Thank You for Choosing Floral K
              </h3>
              <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                Our master florists are selecting stems and hand-crafting your arrangement for dispatch.
              </p>
            </div>

            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/70 text-left space-y-1">
              <span className="text-[10px] text-neutral-400 block uppercase font-medium">
                Order Reference Number:
              </span>
              <span className="font-mono text-sm font-semibold text-[#1d1d1f] block">
                {confirmedOrderNumber}
              </span>
              <span className="text-[11px] text-neutral-500 block pt-1">
                Estimated Delivery: Same-day chilled express courier
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (onClearOrderSuccess) onClearOrderSuccess();
                  onNavigateToTrack(confirmedOrderNumber);
                }}
                className="flex-1 py-3 px-4 rounded-full bg-[#1d1d1f] hover:bg-black text-white text-xs font-medium shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Track Live Order</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (onClearOrderSuccess) onClearOrderSuccess();
                }}
                className="py-3 px-4 rounded-full border border-neutral-200 text-neutral-600 text-xs font-medium hover:bg-neutral-100 cursor-pointer transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Catalog & Shop Section */}
      <section id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Curated Botanical Collection
            </div>
            <h2 className="font-sans text-3xl sm:text-4xl font-semibold text-[#1d1d1f] tracking-tight">
              Fresh Daily Floral Arrangements
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-xl">
              Each arrangement is handcrafted to order with seasonal botanicals and delivered in our signature temperature-regulated box.
            </p>
          </div>

          {/* Active Filter summary & Reset */}
          {(selectedCategory !== 'all' || selectedOccasion !== 'all' || searchQuery) && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-black bg-neutral-100 px-3.5 py-1.5 rounded-full border border-neutral-200/80 cursor-pointer w-fit transition-all"
            >
              <RotateCcw className="w-3 h-3 text-neutral-500" />
              Reset Filters
            </button>
          )}
        </div>

        {/* Category Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-xs'
                : 'bg-white text-neutral-700 border-neutral-200/80 hover:bg-neutral-50'
            }`}
          >
            All Blooms ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                selectedCategory === cat.slug
                  ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-xs'
                  : 'bg-white text-neutral-700 border-neutral-200/80 hover:bg-neutral-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Secondary Filters Bar (Occasions & Sort) */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200 shadow-xs mb-8 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-stone-400 font-semibold flex items-center gap-1 uppercase tracking-wider text-[10px]">
              <Filter className="w-3 h-3" /> Occasion:
            </span>
            <div className="flex flex-wrap gap-1">
              {occasionOptions.map((occ) => {
                const isAll = occ === 'All Occasions';
                const key = isAll ? 'all' : occ;
                const isSelected = selectedOccasion === key;
                return (
                  <button
                    key={occ}
                    onClick={() => setSelectedOccasion(key)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-rose-500 text-white font-bold'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {occ}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-stone-400 font-semibold uppercase tracking-wider text-[10px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
            >
              <option value="featured">Featured & Best Sellers</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Fresh Harvest Newest</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-stone-200" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-300 p-8 space-y-3">
            <p className="font-serif text-xl font-bold text-stone-800">No flower arrangements match your criteria</p>
            <p className="text-xs text-stone-500">Try changing your filters or searching for different flower varieties.</p>
            <button
              onClick={resetFilters}
              className="px-5 py-2 rounded-xl bg-emerald-950 text-amber-200 text-xs font-bold hover:bg-emerald-900 cursor-pointer"
            >
              View All Bouquets
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onSelect={(prod) => setSelectedProduct(prod)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
