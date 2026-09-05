import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/format';
import {
  ShoppingBag,
  Sparkles,
  Truck,
  Compass,
  Store,
  Kanban,
  Package,
  TrendingUp,
  Shield,
  Search,
  Menu,
  X,
  LogOut,
  User as UserIcon
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onSearch?: (term: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onSearch }) => {
  const { user, role, logout } = useAuth();
  const { itemCount, subtotal, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchInput);
      if (currentView !== 'storefront') {
        onNavigate('storefront');
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-xs transition-all">
      {/* Apple Minimalist Announcement Bar */}
      <div className="bg-[#1d1d1f] text-neutral-300 text-[11px] py-1.5 px-4 text-center border-b border-white/5">
        <div className="flex items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1.5 font-medium text-white">
            <Sparkles className="w-3 h-3 text-amber-300" />
            Fresh Dawn Stems Cut Today
          </span>
          <span className="text-neutral-500">•</span>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-neutral-300">
            <Truck className="w-3 h-3 text-neutral-400" />
            Guaranteed Same-Day Express Delivery
          </span>
          <span className="hidden md:inline text-neutral-500">•</span>
          <span className="font-semibold text-white bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
            Code FLORAL10 for 10% Off
          </span>
        </div>
      </div>

      {/* Main Brand & Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo / Monogram */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('storefront')}>
            <div className="w-8 h-8 rounded-full bg-[#1d1d1f] flex items-center justify-center text-white shadow-xs">
              <span className="font-sans font-bold text-xs tracking-tight">FK</span>
            </div>
            <div>
              <span className="font-sans text-lg font-bold tracking-tight text-[#1d1d1f] block leading-none">
                FLORAL K
              </span>
              <span className="text-[9px] tracking-[0.2em] text-neutral-400 uppercase block font-semibold mt-0.5">
                Atelier
              </span>
            </div>
          </div>

          {/* Search Bar (Storefront navigation) */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-xs mx-6 relative">
            <input
              type="text"
              placeholder="Search bouquets, stems, gifts..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 bg-neutral-100/80 border border-neutral-200/60 rounded-full text-xs text-[#1d1d1f] focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all placeholder:text-neutral-400"
            />
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
          </form>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-medium text-neutral-600">
            <button
              onClick={() => onNavigate('storefront')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                currentView === 'storefront' ? 'text-black bg-neutral-100 font-semibold' : 'hover:text-black hover:bg-neutral-50'
              }`}
            >
              Shop Blooms
            </button>

            <button
              onClick={() => onNavigate('track')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                currentView === 'track' ? 'text-black bg-neutral-100 font-semibold' : 'hover:text-black hover:bg-neutral-50'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-neutral-500" />
              Track Order
            </button>

            {/* Admin / Florist Options */}
            {(role === 'admin' || role === 'owner' || role === 'super_admin') && (
              <>
                <div className="h-3 w-px bg-neutral-200 mx-1" />
                <button
                  onClick={() => onNavigate('pos')}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                    currentView === 'pos' ? 'text-black bg-neutral-200/80 font-semibold' : 'hover:text-black hover:bg-neutral-100'
                  }`}
                >
                  <Store className="w-3.5 h-3.5 text-neutral-600" />
                  POS Terminal
                </button>
                <button
                  onClick={() => onNavigate('orders')}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                    currentView === 'orders' ? 'text-black bg-neutral-200/80 font-semibold' : 'hover:text-black hover:bg-neutral-100'
                  }`}
                >
                  <Kanban className="w-3.5 h-3.5 text-neutral-600" />
                  Fulfillment
                </button>
                <button
                  onClick={() => onNavigate('inventory')}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                    currentView === 'inventory' ? 'text-black bg-neutral-200/80 font-semibold' : 'hover:text-black hover:bg-neutral-100'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-neutral-600" />
                  Stock
                </button>
              </>
            )}

            {/* Owner Options */}
            {(role === 'owner' || role === 'super_admin') && (
              <button
                onClick={() => onNavigate('owner')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  currentView === 'owner' ? 'text-black bg-neutral-200/80 font-semibold' : 'hover:text-black hover:bg-neutral-100'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-neutral-600" />
                Analytics
              </button>
            )}

            {/* Super Admin Options */}
            {role === 'super_admin' && (
              <button
                onClick={() => onNavigate('superadmin')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  currentView === 'superadmin' ? 'text-black bg-neutral-200/80 font-semibold' : 'hover:text-black hover:bg-neutral-100'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-neutral-600" />
                Super Admin
              </button>
            )}
          </nav>

          {/* Right Action: Express Cart Drawer Trigger & User Profile */}
          <div className="flex items-center gap-2">
            {/* Express Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1d1d1f] hover:bg-black text-white text-xs font-medium transition-all shadow-xs cursor-pointer group"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-white/90 group-hover:scale-105 transition-transform" />
              <span>Bag</span>
              {itemCount > 0 && (
                <span className="bg-white text-[#1d1d1f] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {itemCount}
                </span>
              )}
              {itemCount > 0 && (
                <span className="hidden sm:inline text-neutral-300 text-xs font-normal">
                  {formatPrice(subtotal)}
                </span>
              )}
            </button>

            {/* User status badge or login */}
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-1.5 text-xs text-neutral-700 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-full cursor-pointer transition-colors">
                  <UserIcon className="w-3 h-3 text-neutral-600" />
                  <span className="max-w-[90px] truncate font-medium">{user.name.split(' ')[0]}</span>
                  <span className="text-[9px] bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded-full font-semibold uppercase">
                    {user.role === 'super_admin' ? 'Super Admin' : user.role}
                  </span>
                </button>
                <div className="hidden group-hover:block absolute right-0 mt-1 w-52 bg-white border border-neutral-200 rounded-2xl shadow-xl p-2 text-xs z-50">
                  <div className="px-2 py-1.5 border-b border-neutral-100">
                    <p className="font-semibold text-neutral-900 truncate">{user.name}</p>
                    <p className="text-neutral-400 truncate text-[11px]">{user.email}</p>
                  </div>
                  
                  {/* Quick role-based links */}
                  <div className="py-1 border-b border-neutral-100 space-y-0.5">
                    <button
                      onClick={() => onNavigate('storefront')}
                      className="w-full text-left flex items-center gap-2 px-2 py-1 text-neutral-700 hover:bg-neutral-50 rounded-lg cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-neutral-500" /> Storefront
                    </button>
                    {(user.role === 'admin' || user.role === 'owner' || user.role === 'super_admin') && (
                      <>
                        <button
                          onClick={() => onNavigate('pos')}
                          className="w-full text-left flex items-center gap-2 px-2 py-1 text-neutral-700 hover:bg-neutral-50 rounded-lg cursor-pointer"
                        >
                          <Store className="w-3.5 h-3.5 text-emerald-600" /> POS Terminal
                        </button>
                        <button
                          onClick={() => onNavigate('orders')}
                          className="w-full text-left flex items-center gap-2 px-2 py-1 text-neutral-700 hover:bg-neutral-50 rounded-lg cursor-pointer"
                        >
                          <Kanban className="w-3.5 h-3.5 text-indigo-600" /> Fulfillment Board
                        </button>
                        <button
                          onClick={() => onNavigate('inventory')}
                          className="w-full text-left flex items-center gap-2 px-2 py-1 text-neutral-700 hover:bg-neutral-50 rounded-lg cursor-pointer"
                        >
                          <Package className="w-3.5 h-3.5 text-amber-600" /> Botanical Inventory
                        </button>
                      </>
                    )}
                    {(user.role === 'owner' || user.role === 'super_admin') && (
                      <button
                        onClick={() => onNavigate('owner')}
                        className="w-full text-left flex items-center gap-2 px-2 py-1 text-neutral-700 hover:bg-neutral-50 rounded-lg cursor-pointer"
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-amber-600" /> Executive Analytics
                      </button>
                    )}
                    {user.role === 'super_admin' && (
                      <button
                        onClick={() => onNavigate('superadmin')}
                        className="w-full text-left flex items-center gap-2 px-2 py-1 text-neutral-700 hover:bg-neutral-50 rounded-lg cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5 text-purple-600" /> Super Admin Portal
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => { logout(); onNavigate('storefront'); }}
                    className="w-full text-left flex items-center gap-1.5 px-2 py-1.5 mt-1 text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onNavigate('login')}
                  className="text-xs font-medium text-neutral-700 hover:text-black px-3 py-1.5 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-stone-600 hover:text-stone-900 rounded-lg cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-stone-200 space-y-2">
            <button
              onClick={() => { onNavigate('storefront'); setMobileMenuOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 rounded-lg"
            >
              Shop Blooms
            </button>
            <button
              onClick={() => { onNavigate('track'); setMobileMenuOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 rounded-lg flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-rose-500" /> Track Order
            </button>
            {(role === 'admin' || role === 'owner' || role === 'super_admin') && (
              <>
                <button
                  onClick={() => { onNavigate('pos'); setMobileMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-emerald-800 bg-emerald-50 rounded-lg flex items-center gap-2"
                >
                  <Store className="w-4 h-4" /> POS Terminal
                </button>
                <button
                  onClick={() => { onNavigate('orders'); setMobileMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 rounded-lg flex items-center gap-2"
                >
                  <Kanban className="w-4 h-4 text-indigo-600" /> Fulfillment Pipeline
                </button>
                <button
                  onClick={() => { onNavigate('inventory'); setMobileMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 rounded-lg flex items-center gap-2"
                >
                  <Package className="w-4 h-4 text-amber-600" /> Stock & Inventory
                </button>
              </>
            )}
            {(role === 'owner' || role === 'super_admin') && (
              <button
                onClick={() => { onNavigate('owner'); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm font-medium text-amber-900 bg-amber-50 rounded-lg flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" /> Owner Executive Analytics
              </button>
            )}
            {role === 'super_admin' && (
              <button
                onClick={() => { onNavigate('superadmin'); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm font-medium text-purple-900 bg-purple-50 rounded-lg flex items-center gap-2"
              >
                <Shield className="w-4 h-4" /> Super Admin Portal
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
