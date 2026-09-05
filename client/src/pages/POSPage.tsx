import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Product, POSSession, POSReceipt } from '../types';
import { formatPrice } from '../utils/format';
import {
  Store,
  Search,
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
  X,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Tag,
  QrCode
} from 'lucide-react';

const FALLBACK_FLORAL_IMAGE = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80';

export const POSPage: React.FC = () => {
  const { user, token } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [activeSession, setActiveSession] = useState<POSSession | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  // Current POS Cart
  const [ticketItems, setTicketItems] = useState<{ product: Product; quantity: number; unitPrice: number }[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Guest');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qrph' | 'gcash' | 'maya'>('cash');
  const [amountTendered, setAmountTendered] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Custom arrangement quick-add
  const [customItemModal, setCustomItemModal] = useState(false);
  const [customName, setCustomName] = useState('Bespoke Florist Hand-Tie');
  const [customPrice, setCustomPrice] = useState('2500.00');

  // Modals
  const [receiptModal, setReceiptModal] = useState<POSReceipt | null>(null);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sessionCashInput, setSessionCashInput] = useState('5000.00');
  const [sessionError, setSessionError] = useState('');
  const [saleError, setSaleError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanFlash, setScanFlash] = useState(false);

  // Load POS Catalog & Register status
  const loadData = () => {
    if (!token) return;

    fetch('/api/pos/quick-catalog', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products || []);
        const cats: { id: number; name: string }[] = [];
        data.products.forEach((p: any) => {
          if (!cats.some((c) => c.id === p.category_id)) {
            cats.push({ id: p.category_id, name: p.category_name });
          }
        });
        setCategories(cats);
      })
      .catch((err) => console.error(err));

    fetch('/api/pos/register/status', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => setActiveSession(data.activeSession))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Calculations (12% EVAT)
  const subtotal = ticketItems.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  const tax = parseFloat(((Math.max(0, subtotal - discountAmount)) * 0.12).toFixed(2));
  const total = parseFloat(((Math.max(0, subtotal - discountAmount)) + tax).toFixed(2));
  const changeDue = paymentMethod === 'cash' ? Math.max(0, parseFloat((amountTendered - total).toFixed(2))) : 0.0;

  // Add item to ticket
  const addItemToTicket = (product: Product) => {
    if (product.stock <= 0) return;

    setScanFlash(true);
    setTimeout(() => setScanFlash(false), 200);

    setTicketItems((prev) => {
      const existing = prev.find((it) => it.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((it) =>
          it.product.id === product.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: product.price }];
    });
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(customPrice) || 2500;
    const fakeProduct: Product = {
      id: Date.now(),
      name: customName || 'Custom Florist Arrangement',
      slug: 'custom-arrangement',
      sku: 'CUSTOM-POS',
      category_id: 1,
      price: priceNum,
      cost_price: priceNum * 0.35,
      stock: 99,
      min_stock_alert: 1,
      description: 'Custom arrangement crafted live at boutique counter',
      images: [FALLBACK_FLORAL_IMAGE],
      flower_types: ['Bespoke Cut Stems'],
      occasion_tags: ['Custom'],
      is_featured: 0,
      is_available: 1
    };
    setTicketItems((prev) => [...prev, { product: fakeProduct, quantity: 1, unitPrice: priceNum }]);
    setCustomItemModal(false);
  };

  const updateItemQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      setTicketItems((prev) => prev.filter((it) => it.product.id !== productId));
    } else {
      setTicketItems((prev) =>
        prev.map((it) => (it.product.id === productId ? { ...it, quantity: qty } : it))
      );
    }
  };

  const clearTicket = () => {
    setTicketItems([]);
    setCustomerName('Walk-in Guest');
    setCustomerPhone('');
    setAmountTendered(0);
    setDiscountAmount(0);
    setSaleError('');
  };

  // Open / Close Register Handlers
  const handleRegisterAction = async () => {
    setSessionError('');
    const isOpening = !activeSession;
    const endpoint = isOpening ? '/api/pos/register/open' : '/api/pos/register/close';
    const bodyKey = isOpening ? 'openingCash' : 'closingCash';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ [bodyKey]: parseFloat(sessionCashInput) || 0 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update register');

      setSessionModalOpen(false);
      loadData();
    } catch (err: any) {
      setSessionError(err.message || 'Register update error');
    }
  };

  // Process POS Sale
  const handleProcessSale = async () => {
    setSaleError('');
    if (ticketItems.length === 0) {
      setSaleError('Add at least one item to process sale');
      return;
    }

    if (paymentMethod === 'cash' && amountTendered < total) {
      setSaleError(`Tendered amount (${formatPrice(amountTendered)}) is less than total (${formatPrice(total)})`);
      return;
    }

    setLoading(true);

    try {
      const validItems = ticketItems.map((it) => {
        const found = products.find((p) => p.id === it.product.id);
        const productId = found ? found.id : products[0]?.id || 1;
        return {
          productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice
        };
      });

      const payload = {
        items: validItems,
        customerName: customerName.trim() || 'Walk-in Guest',
        customerPhone: customerPhone.trim() || undefined,
        paymentMethod,
        amountTendered: paymentMethod === 'cash' ? amountTendered : total,
        discountAmount,
        notes: `In-Store Walk-in Sale (${paymentMethod.toUpperCase()})`
      };

      const res = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process POS sale');

      setReceiptModal(data.receipt);
      clearTicket();
      loadData();
    } catch (err: any) {
      setSaleError(err.message || 'POS sale failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'all' || String(p.category_id) === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm)) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className={`min-h-screen bg-[#f5f5f7] flex flex-col transition-colors duration-200 ${scanFlash ? 'bg-neutral-200/50' : ''}`}>
      {/* Apple Retail POS Top Control Bar */}
      <div className="bg-white/90 backdrop-blur-xl text-[#1d1d1f] px-6 py-3.5 flex flex-wrap items-center justify-between border-b border-neutral-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1d1d1f] text-white font-bold flex items-center justify-center shadow-xs">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <span className="font-sans font-semibold text-sm tracking-tight flex items-center gap-2">
              <span>FLORAL K POS TERMINAL</span>
              <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-sans uppercase font-medium">
                Register #1 • BGC Flagship
              </span>
            </span>
            <span className="text-xs text-neutral-400 block">
              Staff: <strong className="text-neutral-700 font-medium">{user?.name || 'Cashier'}</strong> • Session:{' '}
              {activeSession ? (
                <span className="text-emerald-600 font-medium">Active Open</span>
              ) : (
                <span className="text-amber-600 font-medium">Closed</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {activeSession && (
            <div className="text-right hidden sm:block pr-2">
              <span className="text-[9px] text-neutral-400 uppercase tracking-wider block">Shift Sales</span>
              <span className="font-semibold text-[#1d1d1f] text-sm font-mono">
                {formatPrice(activeSession.total_sales ?? 0)}
              </span>
            </div>
          )}

          <button
            onClick={() => setCustomItemModal(true)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <Tag className="w-3 h-3 text-neutral-500" />
            <span>+ Custom Bouquet</span>
          </button>

          <button
            onClick={() => {
              setSessionCashInput(activeSession ? '5000.00' : '5000.00');
              setSessionModalOpen(true);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shadow-xs cursor-pointer ${
              activeSession
                ? 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'
                : 'bg-[#1d1d1f] hover:bg-black text-white'
            }`}
          >
            {activeSession ? 'Close Register Shift' : 'Open Register Float'}
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Columns: Product Grid & Barcode Search */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          {/* Quick Search & Category Tabs */}
          <div className="bg-white p-4 rounded-3xl border border-neutral-200/80 shadow-xs space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Scan barcode or type bouquet name / SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f7] border border-neutral-200/80 rounded-full text-xs text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black transition-all"
              />
              <Search className="w-4 h-4 text-[#86868b] absolute left-3.5 top-3" />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#1d1d1f] text-white shadow-xs'
                    : 'bg-neutral-100 text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                All Stems ({products.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(String(c.id))}
                  className={`px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === String(c.id)
                      ? 'bg-[#1d1d1f] text-white shadow-xs'
                      : 'bg-neutral-100 text-[#86868b] hover:text-[#1d1d1f]'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Touch Grid */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[600px] pr-1">
            {filteredProducts.map((p) => {
              const inStock = p.stock > 0;
              return (
                <button
                  key={p.id}
                  disabled={!inStock}
                  onClick={() => addItemToTicket(p)}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    inStock
                      ? 'bg-white border-neutral-200/80 hover:border-black/20 hover:shadow-md active:scale-98'
                      : 'bg-neutral-50 border-neutral-200/60 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div>
                    <div className="aspect-square rounded-xl overflow-hidden mb-2.5 bg-[#f5f5f7]">
                      <img
                        src={p.images[0] || FALLBACK_FLORAL_IMAGE}
                        alt={p.name}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_FLORAL_IMAGE; }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] text-[#86868b] font-mono block">{p.sku}</span>
                    <h5 className="font-medium text-xs text-[#1d1d1f] line-clamp-2 leading-tight mt-0.5">
                      {p.name}
                    </h5>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#1d1d1f] font-mono">{formatPrice(p.price)}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      p.stock <= p.min_stock_alert ? 'bg-amber-100 text-amber-800' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {inStock ? `${p.stock} left` : 'Out of stock'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 5 Columns: Current Ticket & Tender Panel */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 flex-1 flex flex-col justify-between">
            
            {/* Ticket Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200/70">
                <div>
                  <h4 className="text-sm font-semibold text-[#1d1d1f]">Current POS Order</h4>
                  <span className="text-[10px] text-[#86868b]">Direct In-Store Counter Tender</span>
                </div>
                {ticketItems.length > 0 && (
                  <button
                    onClick={clearTicket}
                    className="text-xs text-[#86868b] hover:text-rose-600 font-medium transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Customer input */}
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="p-2 border border-neutral-200/80 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
                <input
                  type="tel"
                  placeholder="Phone (Optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="p-2 border border-neutral-200/80 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Items Table */}
              <div className="mt-4 divide-y divide-neutral-100 max-h-56 overflow-y-auto pr-1">
                {ticketItems.length === 0 ? (
                  <div className="text-center py-10 text-[#86868b] text-xs">
                    Tap any bouquet or scan barcode to add to ticket.
                  </div>
                ) : (
                  ticketItems.map(({ product, quantity, unitPrice }) => (
                    <div key={product.id} className="py-2.5 flex items-center justify-between text-xs gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-[#1d1d1f] block truncate">{product.name}</span>
                        <span className="text-[11px] text-[#86868b] font-mono">{formatPrice(unitPrice)} each</span>
                      </div>

                      <div className="flex items-center border border-neutral-200/80 rounded-full bg-[#f5f5f7]">
                        <button
                          onClick={() => updateItemQty(product.id, quantity - 1)}
                          className="p-1 text-neutral-600 hover:text-black cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold font-mono">{quantity}</span>
                        <button
                          onClick={() => updateItemQty(product.id, quantity + 1)}
                          className="p-1 text-neutral-600 hover:text-black cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-medium text-[#1d1d1f] font-mono text-xs w-20 text-right">
                        {formatPrice(unitPrice * quantity)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Financial Summary & Tender Controls */}
            <div className="pt-4 border-t border-neutral-200/70 space-y-3">
              <div className="space-y-1 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#1d1d1f] font-mono">{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Manual Discount</span>
                    <span className="font-mono">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>12% EVAT (BIR Compliant)</span>
                  <span className="font-mono">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-[#1d1d1f] pt-1.5 border-t border-neutral-200/70">
                  <span>Grand Total</span>
                  <span className="text-[#1d1d1f] font-mono text-lg font-bold">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Philippine Payment Method Selector */}
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { key: 'cash', label: 'Cash', icon: <Banknote className="w-3.5 h-3.5" /> },
                  { key: 'qrph', label: 'QRPH', icon: <QrCode className="w-3.5 h-3.5" /> },
                  { key: 'gcash', label: 'GCash', icon: <Smartphone className="w-3.5 h-3.5" /> },
                  { key: 'maya', label: 'Maya', icon: <Smartphone className="w-3.5 h-3.5" /> },
                  { key: 'card', label: 'Card', icon: <CreditCard className="w-3.5 h-3.5" /> },
                ].map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.key as any);
                      if (m.key !== 'cash') setAmountTendered(total);
                    }}
                    className={`py-2 px-1 rounded-xl text-[11px] font-medium flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                      paymentMethod === m.key
                        ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-xs font-semibold'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Cash Tender Input & Quick Buttons */}
              {paymentMethod === 'cash' && (
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-neutral-700">
                    <span>Cash Tendered (₱):</span>
                    <input
                      type="number"
                      step="1"
                      value={amountTendered || ''}
                      onChange={(e) => setAmountTendered(parseFloat(e.target.value) || 0)}
                      className="w-32 p-1.5 border border-neutral-300 rounded-lg text-right font-mono font-semibold bg-white text-[#1d1d1f] focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="flex gap-1.5">
                    {[total, 1000, 2000, 5000].map((amt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAmountTendered(amt)}
                        className="flex-1 py-1 bg-white border border-neutral-200 rounded-lg text-[11px] font-medium text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                      >
                        {idx === 0 ? 'Exact' : formatPrice(amt).replace('.00', '')}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-neutral-200 text-neutral-700">
                    <span className="font-medium">Change Due:</span>
                    <span className="font-mono text-base font-semibold text-emerald-700">
                      {formatPrice(changeDue)}
                    </span>
                  </div>
                </div>
              )}

              {/* Digital E-wallet / QRPH Scan Notice for POS */}
              {paymentMethod !== 'cash' && (
                <div className="p-2.5 bg-neutral-100 rounded-xl text-center text-xs text-neutral-600 font-medium">
                  Tender: <strong className="uppercase text-neutral-900">{paymentMethod}</strong> • Instant Verification
                </div>
              )}

              {saleError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{saleError}</span>
                </div>
              )}

              {/* Complete POS Sale Button */}
              <button
                type="button"
                disabled={loading || ticketItems.length === 0}
                onClick={handleProcessSale}
                className="w-full py-3.5 rounded-full bg-[#1d1d1f] hover:bg-black text-white font-medium text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{loading ? 'Processing Sale...' : `Complete Sale • ${formatPrice(total)}`}</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Custom Item Modal */}
      {customItemModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-neutral-200/80 space-y-4">
            <h4 className="text-base font-semibold text-[#1d1d1f]">Add Custom Bouquet / Arrangement</h4>
            <form onSubmit={handleAddCustomItem} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-[#1d1d1f] block mb-1">Arrangement Title</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full p-2.5 border border-neutral-200/80 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="font-medium text-[#1d1d1f] block mb-1">Custom Price (₱)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full p-2.5 border border-neutral-200/80 rounded-xl bg-[#f5f5f7] font-mono font-semibold text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#1d1d1f] hover:bg-black text-white font-medium rounded-full transition-all cursor-pointer shadow-xs"
                >
                  Add to Ticket
                </button>
                <button
                  type="button"
                  onClick={() => setCustomItemModal(false)}
                  className="py-2.5 px-4 border border-neutral-200/80 rounded-full text-[#1d1d1f] font-medium hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Thermal Receipt Modal */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-neutral-200/80 text-[#1d1d1f] space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-200/80">
              <span className="text-xs font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-neutral-600" /> Thermal Print Preview
              </span>
              <button
                onClick={() => setReceiptModal(null)}
                className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            {/* Thermal Receipt Paper Layout */}
            <div className="bg-[#f5f5f7] p-4 rounded-2xl border border-dashed border-neutral-300 font-mono text-xs space-y-3">
              <div className="text-center space-y-0.5">
                <h4 className="font-sans font-semibold text-sm text-[#1d1d1f] uppercase tracking-tight">FLORAL K ATELIER</h4>
                <p className="text-[10px] text-[#86868b]">{receiptModal.storeAddress}</p>
                <p className="text-[10px] text-[#86868b]">Tel: {receiptModal.storePhone}</p>
              </div>

              <div className="pt-2 border-t border-dashed border-neutral-300 text-[10px] space-y-0.5">
                <p>Order: <strong>{receiptModal.orderNumber}</strong></p>
                <p>Date: {new Date(receiptModal.date).toLocaleString()}</p>
                <p>Cashier: {receiptModal.cashierName}</p>
                <p>Customer: {receiptModal.customerName}</p>
              </div>

              <div className="pt-2 border-t border-dashed border-neutral-300 space-y-1">
                {receiptModal.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[170px]">{it.quantity}x {it.productName}</span>
                    <span>{formatPrice(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-dashed border-neutral-300 space-y-0.5 text-right text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatPrice(receiptModal.subtotal)}</span>
                </div>
                {receiptModal.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-{formatPrice(receiptModal.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>12% EVAT:</span>
                  <span>{formatPrice(receiptModal.tax)}</span>
                </div>
                <div className="flex justify-between font-semibold text-[#1d1d1f] text-xs pt-1 border-t border-neutral-200">
                  <span>TOTAL:</span>
                  <span>{formatPrice(receiptModal.total)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>Tendered ({receiptModal.paymentMethod.toUpperCase()}):</span>
                  <span>{formatPrice(receiptModal.amountTendered)}</span>
                </div>
                {receiptModal.paymentMethod === 'cash' && (
                  <div className="flex justify-between font-semibold text-emerald-800">
                    <span>Change Due:</span>
                    <span>{formatPrice(receiptModal.changeDue)}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-3 border-t border-dashed border-neutral-300 text-[9px] text-[#86868b]">
                <p>{receiptModal.footer}</p>
                <p className="font-semibold mt-1">*** COPY FOR FLORIST PACKAGING ***</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-full bg-[#1d1d1f] hover:bg-black text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" /> Print Thermal Ticket
              </button>
              <button
                onClick={() => setReceiptModal(null)}
                className="py-2.5 px-4 rounded-full border border-neutral-200/80 text-[#1d1d1f] font-medium text-xs hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Float Modal */}
      {sessionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-neutral-200/80 space-y-4">
            <h4 className="text-base font-semibold text-[#1d1d1f]">
              {activeSession ? 'Close Cash Drawer & Shift' : 'Open Register Session'}
            </h4>
            <p className="text-xs text-[#86868b]">
              {activeSession
                ? 'Enter final cash count in the drawer to record closing float & compute discrepancies.'
                : 'Enter opening cash float (bills & coins in PHP) in register #1.'}
            </p>

            <div>
              <label className="text-xs font-medium text-[#1d1d1f] block mb-1">
                {activeSession ? 'Closing Counted Cash (₱)' : 'Opening Cash Float (₱)'}
              </label>
              <input
                type="number"
                step="1"
                value={sessionCashInput}
                onChange={(e) => setSessionCashInput(e.target.value)}
                className="w-full p-2.5 border border-neutral-200/80 rounded-xl bg-[#f5f5f7] font-mono font-semibold text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            {sessionError && (
              <p className="text-xs text-rose-600">{sessionError}</p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleRegisterAction}
                className="flex-1 py-2.5 bg-[#1d1d1f] hover:bg-black text-white rounded-full font-medium text-xs transition-all cursor-pointer shadow-xs"
              >
                Confirm {activeSession ? 'Close Shift' : 'Open Register'}
              </button>
              <button
                onClick={() => setSessionModalOpen(false)}
                className="py-2.5 px-4 border border-neutral-200/80 rounded-full text-[#1d1d1f] text-xs font-medium hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
