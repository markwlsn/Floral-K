import React from 'react';
import { Sparkles, ShieldCheck, Truck, Clock, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-emerald-950 text-stone-300 pt-16 pb-12 border-t border-emerald-900 mt-20">
      {/* Guarantees Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-emerald-900/60">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-900 flex items-center justify-center text-amber-300 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Farm-to-Vase Freshness</h4>
              <p className="text-xs text-stone-400 mt-1">Sourced direct at 5:00 AM daily from eco-certified boutique growers.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-900 flex items-center justify-center text-rose-300 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">2-Hour Express Dispatch</h4>
              <p className="text-xs text-stone-400 mt-1">Temperature-controlled chilled courier delivery across the city.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-900 flex items-center justify-center text-amber-300 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">7-Day Bloom Guarantee</h4>
              <p className="text-xs text-stone-400 mt-1">If your blooms don't radiate beauty for a full week, we replace immediately.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-900 flex items-center justify-center text-rose-300 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Live Fulfillment Tracking</h4>
              <p className="text-xs text-stone-400 mt-1">Follow every phase from florist assembly to doorstep handoff.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-serif text-2xl font-bold text-white tracking-wider">FLORAL K</span>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed">
            Metro Manila's premier floral design atelier, blending avant-garde European botanical artistry with rapid chilled same-day gifting across BGC, Makati, and Greater Manila.
          </p>
          <p className="text-xs text-amber-200/80 font-serif italic">
            "Flowers speak what words cannot utter."
          </p>
        </div>

        <div>
          <h5 className="text-xs font-semibold uppercase tracking-wider text-amber-300 mb-3">Atelier Hours & Location</h5>
          <p className="text-xs text-stone-400 leading-relaxed">
            28th St. cor. 7th Avenue, Bonifacio Global City (BGC)<br />
            Taguig, Metro Manila 1634, Philippines<br />
            Phone: <span className="text-stone-200">+63 (02) 8812-3567 / 0917-555-BLOOM</span><br />
            Daily: 8:00 AM – 8:00 PM PHT
          </p>
        </div>

        <div>
          <h5 className="text-xs font-semibold uppercase tracking-wider text-amber-300 mb-3">Quick Navigation</h5>
          <ul className="space-y-2 text-xs text-stone-400">
            <li>
              <button onClick={() => onNavigate('storefront')} className="hover:text-white transition-colors cursor-pointer">
                Online Bloom Shop
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('track')} className="hover:text-white transition-colors cursor-pointer">
                Live Order Tracker
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('pos')} className="hover:text-white transition-colors cursor-pointer">
                Staff POS Register Terminal
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('orders')} className="hover:text-white transition-colors cursor-pointer">
                Florist Fulfillment Board
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h5 className="text-xs font-semibold uppercase tracking-wider text-amber-300 mb-3">Management & Roles</h5>
          <ul className="space-y-2 text-xs text-stone-400">
            <li>
              <button onClick={() => onNavigate('owner')} className="hover:text-amber-200 transition-colors cursor-pointer">
                Owner Financial Dashboard
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('inventory')} className="hover:text-amber-200 transition-colors cursor-pointer">
                Inventory & Stock Alerts
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('superadmin')} className="hover:text-purple-300 transition-colors cursor-pointer">
                Super Admin Configuration
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('login')} className="hover:text-white transition-colors cursor-pointer">
                Role Sign-In Portal
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
        <p>© 2026 Floral K Boutique & Atelier. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Crafted with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for floral lovers
        </p>
      </div>
    </footer>
  );
};
