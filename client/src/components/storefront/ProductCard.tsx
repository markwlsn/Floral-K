import React from 'react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { ShoppingBag, Sparkles, Eye, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart, items } = useCart();
  const [justAdded, setJustAdded] = React.useState(false);

  const cartItem = items.find((it) => it.product.id === product.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const savings = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round(product.compare_at_price - product.price)
    : 0;

  const primaryImage = product.images && product.images.length > 0
    ? product.images[0]
    : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80';

  return (
    <div
      onClick={() => onSelect(product)}
      className="group bg-white rounded-3xl overflow-hidden border border-neutral-200/70 hover:border-black/20 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col cursor-pointer relative"
    >
      {/* Visual Image Container */}
      <div className="relative aspect-square overflow-hidden bg-neutral-100/70">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.is_featured === 1 && (
            <span className="bg-[#1d1d1f]/90 backdrop-blur-md text-white font-medium text-[10px] tracking-wide uppercase px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-300" /> Featured
            </span>
          )}
          {savings > 0 && (
            <span className="bg-neutral-100/90 backdrop-blur-md text-neutral-800 font-medium text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-full border border-neutral-200 shadow-xs">
              Save ${savings}
            </span>
          )}
        </div>

        {/* Stock Alert Badge */}
        {product.stock <= product.min_stock_alert && product.stock > 0 && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md text-amber-800 text-[10px] font-medium px-2.5 py-1 rounded-full border border-amber-200/80">
            Only {product.stock} available today
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Category & Flower tags */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="text-[11px] font-medium text-neutral-400">
              {product.category_name || 'Artisan Floral'}
            </span>
            {product.origin && (
              <span className="text-[11px] text-neutral-400">
                • {product.origin.split(',')[0]}
              </span>
            )}
          </div>

          <h4 className="font-sans font-semibold text-[#1d1d1f] text-base group-hover:text-black transition-colors line-clamp-1">
            {product.name}
          </h4>

          <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
            {product.short_description || product.description}
          </p>
        </div>

        {/* Pricing & Quick Add Action */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold text-base text-[#1d1d1f]">
              ${product.price.toFixed(2)}
            </span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-xs text-neutral-400 line-through">
                ${product.compare_at_price.toFixed(2)}
              </span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : inCartQty > 0
                ? 'bg-neutral-200 text-[#1d1d1f] hover:bg-neutral-300'
                : 'bg-[#1d1d1f] text-white hover:bg-black'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Added</span>
              </>
            ) : inCartQty > 0 ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#1d1d1f]" />
                <span>{inCartQty} in Bag</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3 h-3" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
