import React, { useState } from 'react';
import type { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/format';
import {
  X,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Truck,
  Droplets,
  Check,
  Plus,
  Minus,
  Gift,
  Compass,
  Wind,
  Ruler,
  Layers
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

interface LuxuryAddOn {
  id: string;
  name: string;
  price: number;
  icon: string;
}

const FALLBACK_FLORAL_IMAGE = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80';

const ADD_ONS: LuxuryAddOn[] = [
  { id: 'chocolates', name: 'Belgian Truffles (8 pcs)', price: 450.0, icon: '🍫' },
  { id: 'champagne', name: 'Rosé Champagne Piccolo (375ml)', price: 1250.0, icon: '🍾' },
  { id: 'candle', name: 'Soy Botanical Candle', price: 650.0, icon: '🕯️' },
  { id: 'vase', name: 'Fluted Ceramic Vase', price: 750.0, icon: '🏺' }
];

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<'classic' | 'deluxe' | 'grand'>('classic');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'floristry' | 'care'>('overview');
  const [justAdded, setJustAdded] = useState(false);

  if (!product) return null;

  const sizePricing = {
    classic: { label: 'Classic Signature', extra: 0, desc: 'Original florist stem count' },
    deluxe: { label: 'Deluxe (+50% Stems)', extra: 950.0, desc: '1.5x fullness & trailing greens' },
    grand: { label: 'Grand (+100% Stems)', extra: 1850.0, desc: 'Double volume statement piece' }
  };

  const addOnTotal = selectedAddOns.reduce((sum, id) => {
    const found = ADD_ONS.find((a) => a.id === id);
    return sum + (found ? found.price : 0);
  }, 0);

  const unitPrice = product.price + sizePricing[selectedSize].extra + addOnTotal;
  const totalPrice = unitPrice * quantity;

  const toggleAddOn = (id: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAdd = () => {
    const customProduct: Product = {
      ...product,
      name: `${product.name} (${sizePricing[selectedSize].label})`,
      price: unitPrice
    };
    addToCart(customProduct, quantity);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 800);
  };

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl relative border border-neutral-200/80 max-h-[92vh] flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 p-2 rounded-full transition-all cursor-pointer"
          title="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Photo Column */}
        <div className="w-full md:w-5/12 bg-neutral-50 p-6 flex flex-col justify-between space-y-4 border-r border-neutral-100">
          <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-xs relative">
            <img
              src={images[selectedImgIndex]}
              alt={product.name}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== FALLBACK_FLORAL_IMAGE) {
                  target.src = FALLBACK_FLORAL_IMAGE;
                }
              }}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {product.is_featured === 1 && (
              <span className="absolute top-3 left-3 bg-[#1d1d1f]/90 text-white font-medium text-[10px] tracking-wide uppercase px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-300" /> Featured
              </span>
            )}
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md text-neutral-800 text-[10px] font-medium px-2.5 py-1 rounded-full border border-neutral-200">
              Only {product.stock} available for today
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 justify-center">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImgIndex(idx)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                    selectedImgIndex === idx ? 'border-black ring-1 ring-black scale-102' : 'border-neutral-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== FALLBACK_FLORAL_IMAGE) {
                        target.src = FALLBACK_FLORAL_IMAGE;
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Quick specs badge */}
          <div className="p-3 bg-white rounded-2xl border border-neutral-200/80 text-xs text-neutral-600 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-[#1d1d1f]">
              <Truck className="w-3.5 h-3.5 text-neutral-500" />
              <span>Same-Day Chilled Courier Delivery</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-snug">
              Protected in moisture-retaining botanical hydration wraps for peak bloom arrival.
            </p>
          </div>
        </div>

        {/* Details & Purchasing Column */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto space-y-5">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  {product.category_name || 'Atelier Floral'}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">SKU: {product.sku}</span>
              </div>
              <h3 className="font-sans font-semibold text-2xl sm:text-3xl text-[#1d1d1f] mt-1 leading-snug">
                {product.name}
              </h3>
            </div>

            {/* Pricing Header */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-[#1d1d1f]">
                {formatPrice(totalPrice)}
              </span>
              {product.compare_at_price && (
                <span className="text-sm text-neutral-400 line-through">
                  {formatPrice(product.compare_at_price + sizePricing[selectedSize].extra)}
                </span>
              )}
              <span className="text-[11px] bg-neutral-100 text-neutral-700 font-medium px-2.5 py-0.5 rounded-full">
                Cut Fresh at Dawn
              </span>
            </div>

            {/* Section Tabs: Overview / Floristry & Terroir / Care & Dimensions */}
            <div className="flex border-b border-neutral-200 gap-6 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`pb-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'border-black text-black font-semibold'
                    : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('floristry')}
                className={`pb-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'floristry'
                    ? 'border-black text-black font-semibold'
                    : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                Stems & Terroir
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('care')}
                className={`pb-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'care'
                    ? 'border-black text-black font-semibold'
                    : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                Care & Specs
              </button>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {product.description}
                </p>

                {/* Bouquet Size Selector */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    Select Bouquet Size
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['classic', 'deluxe', 'grand'] as const).map((sizeKey) => {
                      const s = sizePricing[sizeKey];
                      const isSelected = selectedSize === sizeKey;
                      return (
                        <button
                          key={sizeKey}
                          type="button"
                          onClick={() => setSelectedSize(sizeKey)}
                          className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-xs'
                              : 'bg-neutral-50 text-neutral-700 border-neutral-200/70 hover:bg-neutral-100'
                          }`}
                        >
                          <span className="text-xs font-semibold block">{s.label}</span>
                          <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                            {s.extra === 0 ? 'Standard' : `+${formatPrice(s.extra)}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Luxury Gifting Add-ons */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                    <span>Add Curated Luxuries</span>
                    <span className="text-[10px] text-neutral-400 font-normal">Packaged in keepsake gift box</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ADD_ONS.map((add) => {
                      const isChecked = selectedAddOns.includes(add.id);
                      return (
                        <button
                          key={add.id}
                          type="button"
                          onClick={() => toggleAddOn(add.id)}
                          className={`p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-neutral-100 border-neutral-400 text-black shadow-xs font-medium'
                              : 'bg-neutral-50 border-neutral-200/80 text-neutral-700 hover:bg-neutral-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-sm">{add.icon}</span>
                            <span className="text-[11px] truncate">{add.name}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-neutral-900 shrink-0 ml-1">
                            +{formatPrice(add.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Floristry & Terroir */}
            {activeTab === 'floristry' && (
              <div className="space-y-4 text-xs">
                {/* Stem Recipe */}
                <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/70 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-[#1d1d1f]">
                    <Layers className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Florist Stem Composition & Recipe</span>
                  </div>
                  <p className="text-neutral-600 leading-relaxed text-[11px]">
                    {product.stem_recipe || (product.flower_types && product.flower_types.join(', ')) || 'Hand-selected seasonal stems.'}
                  </p>
                </div>

                {/* Terroir / Origin */}
                {product.origin && (
                  <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/70 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-[#1d1d1f]">
                      <Compass className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Farm Origin & Terroir</span>
                    </div>
                    <p className="text-neutral-600 text-[11px] leading-relaxed">
                      {product.origin}
                    </p>
                  </div>
                )}

                {/* Scent Profile */}
                {product.scent_notes && (
                  <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/70 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-[#1d1d1f]">
                      <Wind className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Natural Scent Profile</span>
                    </div>
                    <p className="text-neutral-600 text-[11px] leading-relaxed">
                      {product.scent_notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Care & Dimensions */}
            {activeTab === 'care' && (
              <div className="space-y-4 text-xs">
                {/* Dimensions & Vase Pairing */}
                {product.dimensions && (
                  <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/70 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-[#1d1d1f]">
                      <Ruler className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Dimensions & Vessel Pairing</span>
                    </div>
                    <p className="text-neutral-600 text-[11px] leading-relaxed">
                      {product.dimensions}
                    </p>
                  </div>
                )}

                {/* Care Guide */}
                <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/70 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-[#1d1d1f]">
                    <Droplets className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Florist Care & Longevity Instructions</span>
                  </div>
                  <p className="text-neutral-600 text-[11px] leading-relaxed">
                    {product.care_instructions || 'Trim stems 2cm at a 45-degree angle. Place in cool water away from direct heat.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Stepper & Primary Action */}
          <div className="space-y-3 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-neutral-200 rounded-full bg-neutral-50 p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1.5 text-neutral-600 hover:text-black cursor-pointer rounded-full"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 text-xs font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-1.5 text-neutral-600 hover:text-black cursor-pointer rounded-full"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleAdd}
                className={`flex-1 py-3 px-6 rounded-full font-medium text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  justAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#1d1d1f] hover:bg-black text-white'
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4" /> Added to Bag
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Add to Bag • {formatPrice(totalPrice)}
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-around text-[11px] text-neutral-400 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" /> 7-Day Freshness Guarantee
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Gift className="w-3.5 h-3.5 text-neutral-500" /> Free Handwritten Wax Seal Card
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
