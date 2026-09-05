import React, { useState, useEffect } from 'react';
import { Search, Compass, Package, CheckCircle2, Clock, Truck, Gift, AlertCircle, MapPin, Navigation, ShieldCheck, Building2, Store } from 'lucide-react';
import type { Order } from '../types';
import { formatPrice } from '../utils/format';

interface TrackOrderPageProps {
  initialOrderNumber?: string | null;
}

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({ initialOrderNumber }) => {
  const [orderNumberInput, setOrderNumberInput] = useState(initialOrderNumber || 'FK-20260905-1001');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTracking = (orderNum: string) => {
    if (!orderNum.trim()) return;
    setLoading(true);
    setError('');

    fetch(`/api/orders/track/${encodeURIComponent(orderNum.trim())}`)
      .then((res) => {
        if (!res.ok) throw new Error('Order not found with that reference number');
        return res.json();
      })
      .then((data) => {
        setOrder(data.order);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Could not find order tracking details');
        setOrder(null);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (initialOrderNumber) {
      setOrderNumberInput(initialOrderNumber);
      fetchTracking(initialOrderNumber);
    } else {
      fetchTracking('FK-20260905-1001');
    }
  }, [initialOrderNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(orderNumberInput);
  };

  const isPickup = order?.order_type === 'online_pickup';

  const steps = [
    { key: 'confirmed', label: 'Order Confirmed', desc: 'Payment verified & stems allocated', icon: <CheckCircle2 className="w-4 h-4" /> },
    { key: 'arranging', label: 'Florist Arranging', desc: 'Handcrafted in studio with fresh cuts', icon: <Package className="w-4 h-4" /> },
    { key: 'ready', label: isPickup ? 'Ready for Pickup' : 'Ready for Dispatch', desc: isPickup ? 'Held in atelier chilled showcase' : 'Chilled packaging & wax seal tied', icon: <Clock className="w-4 h-4" /> },
    { key: 'out_for_delivery', label: isPickup ? 'Pickup Window Active' : 'Out for Courier Delivery', desc: isPickup ? 'Awaiting customer arrival at atelier' : 'Temperature-controlled transport', icon: isPickup ? <Store className="w-4 h-4" /> : <Truck className="w-4 h-4" /> },
    { key: 'delivered', label: isPickup ? 'Handed to Customer' : 'Delivered to Recipient', desc: 'Bouquet handoff verified', icon: <Gift className="w-4 h-4" /> },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'pending':
      case 'confirmed':
        return 0;
      case 'arranging':
        return 1;
      case 'ready_for_pickup':
        return 2;
      case 'out_for_delivery':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 0;
    }
  };

  const currentStep = order ? getStepIndex(order.status) : 0;

  return (
    <div className="min-h-screen bg-[#fbfbfd] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Tracking Header & Search */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-[11px] font-medium">
            <Compass className="w-3.5 h-3.5 text-neutral-600" />
            <span>Real-Time Atelier Dispatch Tracking • Metro Manila</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1d1d1f]">
            Track Your Floral Order
          </h1>
          <p className="text-xs sm:text-sm text-[#86868b] max-w-md mx-auto">
            Enter your order reference number to follow your arrangement from florist stem cutting to doorstep presentation or boutique pickup.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-2 pt-2">
            <input
              type="text"
              required
              placeholder="e.g. FK-20260905-1001"
              value={orderNumberInput}
              onChange={(e) => setOrderNumberInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-full border border-neutral-200/80 bg-white font-mono text-xs uppercase shadow-xs focus:outline-none focus:ring-1 focus:ring-black"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#1d1d1f] hover:bg-black text-white rounded-full text-xs font-medium shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Searching...' : 'Track'}</span>
            </button>
          </form>

          {error && (
            <div className="max-w-md mx-auto p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Tracking Results Card */}
        {order && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs space-y-8">
            {/* Header Details */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-100 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">Order Reference</span>
                  <span className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                    isPickup ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                  }`}>
                    {isPickup ? 'Store Pickup Reservation' : 'Metro Manila Chilled Delivery'}
                  </span>
                  <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {order.payment_method} ({order.payment_status})
                  </span>
                </div>
                <h3 className="font-mono text-xl font-semibold text-[#1d1d1f] mt-1">{order.order_number}</h3>
                <span className="text-xs text-[#86868b] mt-1 block">
                  Recipient: <strong className="text-[#1d1d1f] font-medium">{order.recipient_name || order.customer_name}</strong>
                </span>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">Schedule</span>
                <p className="text-sm font-semibold text-[#1d1d1f] mt-0.5">{order.delivery_date || 'Today Express'}</p>
                <p className="text-xs text-neutral-600 font-medium">{order.delivery_time_slot || 'Standard Dispatch'}</p>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="py-2">
              <div className="relative">
                <div className="hidden md:block absolute top-5 left-8 right-8 h-0.5 bg-neutral-200 -z-0">
                  <div
                    className="h-full bg-[#1d1d1f] transition-all duration-500"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
                  {steps.map((st, idx) => {
                    const isPassed = idx < currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <div key={st.key} className="flex md:flex-col items-center md:text-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            isPassed
                              ? 'bg-[#1d1d1f] text-white shadow-2xs'
                              : isCurrent
                              ? 'bg-[#1d1d1f] text-white ring-4 ring-neutral-200/80 scale-105 font-semibold'
                              : 'bg-[#f5f5f7] text-[#86868b] border border-neutral-200/80'
                          }`}
                        >
                          {st.icon}
                        </div>

                        <div>
                          <p className={`text-xs font-semibold leading-tight ${isCurrent ? 'text-[#1d1d1f]' : 'text-neutral-700'}`}>
                            {st.label}
                          </p>
                          <p className="text-[11px] text-[#86868b] mt-0.5 leading-snug">
                            {st.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Courier Transit Route or Store Pickup Showcase */}
            <div className="bg-[#f5f5f7] border border-neutral-200/70 rounded-3xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {isPickup ? <Building2 className="w-4 h-4" /> : <Navigation className="w-4 h-4" />}
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-[#1d1d1f]">
                      {isPickup ? 'Atelier Pickup Status' : 'Chilled Courier Route Progress'}
                    </h5>
                    <span className="text-[10px] text-[#86868b]">
                      {isPickup
                        ? 'Conditioned in BGC Flagship Temperature Showcase (10°C)'
                        : 'Vehicle: Van #4 (Refrigerated at 10°C) • Courier: Michael Vance (Metro Manila Dispatch)'}
                    </span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#1d1d1f] text-xs font-medium border border-neutral-200/80 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Stems Kept Hydrated in Transit</span>
                </div>
              </div>

              {/* Graphic route mock */}
              <div className="h-28 bg-[#1d1d1f] rounded-2xl relative overflow-hidden flex items-center px-8 text-white shadow-inner">
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-white/15 border-b border-dashed border-white/30" />

                <div className="flex items-center justify-between w-full relative z-10">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-white text-[#1d1d1f] flex items-center justify-center font-bold text-xs shadow-md">
                      🏢
                    </div>
                    <span className="text-[10px] font-medium mt-1 text-neutral-300">BGC Atelier</span>
                  </div>

                  <div className="flex flex-col items-center animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-white text-[#1d1d1f] flex items-center justify-center shadow-lg border border-neutral-200">
                      {isPickup ? <Store className="w-4 h-4 text-emerald-700" /> : <Truck className="w-4 h-4 text-[#1d1d1f]" />}
                    </div>
                    <span className="text-[10px] font-semibold mt-1 text-white">
                      {isPickup ? 'Ready at Counter' : 'En Route'}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-xs shadow-md border border-white/30">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-medium mt-1 text-neutral-300">Destination</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Order Meta: Destination & Handwritten Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-100 text-xs">
              {/* Destination */}
              <div className="p-4 bg-[#f5f5f7] rounded-2xl space-y-1.5 border border-neutral-200/60">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] block">
                  {isPickup ? 'Pickup Location' : 'Delivery Destination'}
                </span>
                <p className="font-medium text-[#1d1d1f]">
                  {order.delivery_address || 'Storefront Pickup - Floral K Atelier BGC'}
                </p>
                {order.customer_phone && (
                  <p className="text-[#86868b] text-[11px]">Contact: {order.customer_phone}</p>
                )}
              </div>

              {/* Handwritten Note Preview */}
              <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-900 block">
                  Enclosed Handwritten Gift Note
                </span>
                <p className="font-serif italic text-sm text-[#1d1d1f] leading-snug">
                  &ldquo;{order.card_message || 'Complimentary card with signature Floral K wax seal.'}&rdquo;
                </p>
              </div>
            </div>

            {/* Line items summary */}
            {order.items && order.items.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-neutral-100">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] block">
                  Arrangements in this order ({order.items.length})
                </span>
                <div className="divide-y divide-neutral-100">
                  {order.items.map((it, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium text-[#1d1d1f]">{it.product_name}</span>
                        <span className="text-[#86868b] ml-2 font-mono text-[11px]">SKU: {it.product_sku}</span>
                      </div>
                      <div className="font-medium text-[#1d1d1f] font-mono">
                        Qty: {it.quantity} • {formatPrice(it.unit_price * it.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
