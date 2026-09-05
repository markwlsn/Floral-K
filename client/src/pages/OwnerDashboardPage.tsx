import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Discount } from '../types';
import { formatPrice } from '../utils/format';
import {
  TrendingUp,
  Award,
  Tag,
  Plus,
  CheckCircle2,
  XCircle,
  Store,
  Globe,
  Clock,
  Zap
} from 'lucide-react';

export const OwnerDashboardPage: React.FC = () => {
  const { token } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);

  // New discount modal state
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'percentage' | 'fixed'>('percentage');
  const [newValue, setNewValue] = useState('15');
  const [newMinSpend, setNewMinSpend] = useState('2000');
  const [promoError, setPromoError] = useState('');

  const fetchAnalytics = () => {
    if (!token) return;
    setLoading(true);

    Promise.all([
      fetch('/api/analytics/overview', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch('/api/analytics/top-products', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch('/api/settings/discounts', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json())
    ])
      .then(([ov, top, disc]) => {
        setOverview(ov.overview);
        setTopProducts(top.topProducts || []);
        setDiscounts(disc.discounts || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  const handleToggleDiscount = async (id: number) => {
    try {
      const res = await fetch(`/api/settings/discounts/${id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAnalytics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    try {
      const res = await fetch('/api/settings/discounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          code: newCode.trim(),
          discount_type: newType,
          value: parseFloat(newValue),
          min_spend: parseFloat(newMinSpend) || 0
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create promo');

      setShowPromoModal(false);
      setNewCode('');
      fetchAnalytics();
    } catch (err: any) {
      setPromoError(err.message || 'Error creating promo code');
    }
  };

  if (loading || !overview) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] p-8 flex items-center justify-center">
        <div className="text-center text-sm font-medium text-[#86868b]">
          Loading Owner Executive Analytics...
        </div>
      </div>
    );
  }

  // Hourly rush hour pattern
  const rushHours = [
    { hour: '8am', orders: 2, height: '30%' },
    { hour: '10am', orders: 5, height: '65%' },
    { hour: '12pm', orders: 8, height: '90%' },
    { hour: '2pm', orders: 6, height: '75%' },
    { hour: '4pm', orders: 7, height: '85%' },
    { hour: '6pm', orders: 4, height: '50%' }
  ];

  return (
    <div className="min-h-screen bg-[#fbfbfd] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-[11px] font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-neutral-600" />
              <span>Executive Financial Overview • Manila, Philippines</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] mt-1.5">
              Owner Business Dashboard
            </h1>
            <p className="text-xs text-[#86868b] mt-0.5">
              High-level profitability, sales channels, revenue performance, and campaign controls in Philippine Pesos (PHP).
            </p>
          </div>

          <button
            onClick={() => setShowPromoModal(true)}
            className="px-4 py-2.5 bg-[#1d1d1f] hover:bg-black text-white text-xs font-medium rounded-full shadow-xs flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Create Promo Code
          </button>
        </div>

        {/* 4 Core Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Gross Revenue */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] block">
              Gross Revenue (Paid)
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xl sm:text-2xl font-semibold text-[#1d1d1f]">
                {formatPrice(overview.grossRevenue)}
              </span>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Today: {formatPrice(overview.todayRevenue)}
              </span>
            </div>
            <p className="text-[11px] text-[#86868b]">Includes Web & Counter POS orders</p>
          </div>

          {/* Orders Count */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] block">
              Total Order Volume
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-2xl font-semibold text-[#1d1d1f]">
                {overview.totalOrders}
              </span>
              <span className="text-[11px] font-medium text-neutral-700 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                Today: {overview.todayOrders}
              </span>
            </div>
            <p className="text-[11px] text-[#86868b]">Across all fulfillment stages</p>
          </div>

          {/* Average Order Value */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] block">
              Average Order Value (AOV)
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xl sm:text-2xl font-semibold text-[#1d1d1f]">
                {formatPrice(overview.averageOrderValue)}
              </span>
              <span className="text-[11px] font-medium text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                Target: ₱3,500
              </span>
            </div>
            <p className="text-[11px] text-[#86868b]">Premium bouquet bundle average</p>
          </div>

          {/* Gross Profit & Margin */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] block">
              Gross Profit & Margin
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xl sm:text-2xl font-semibold text-[#1d1d1f]">
                {formatPrice(overview.grossProfit)}
              </span>
              <span className="text-[11px] font-medium text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                {overview.profitMarginPercent}% Margin
              </span>
            </div>
            <p className="text-[11px] text-[#86868b]">COGS Deducted: {formatPrice(overview.totalCogs)}</p>
          </div>
        </div>

        {/* 3-Column Split: Sales Channels, Rush Hour Activity, and Top Arrangements */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Sales Channels (Web vs POS) */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-[#1d1d1f]">
              Revenue by Sales Channel
            </h3>
            <div className="space-y-3">
              {overview.salesBySource?.map((src: any) => {
                const isWeb = src.source === 'web';
                const percent = overview.grossRevenue > 0
                  ? Math.round((src.revenue / overview.grossRevenue) * 100)
                  : 0;
                return (
                  <div key={src.source} className="p-3.5 bg-[#f5f5f7] rounded-2xl space-y-2 border border-neutral-200/60">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium flex items-center gap-1.5 text-[#1d1d1f]">
                        {isWeb ? <Globe className="w-4 h-4 text-neutral-600" /> : <Store className="w-4 h-4 text-neutral-600" />}
                        {isWeb ? 'Online Web Storefront' : 'In-Store Walk-in POS'}
                      </span>
                      <span className="font-mono font-medium text-[#1d1d1f]">{formatPrice(src.revenue)}</span>
                    </div>
                    <div className="w-full bg-neutral-200/80 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#1d1d1f]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-[#86868b]">
                      <span>{src.count} Orders</span>
                      <span>{percent}% of Gross Sales</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Peak Rush Hour Order Density */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-[#1d1d1f] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-neutral-600" /> Hourly Rush Hour Traffic
            </h3>
            <p className="text-xs text-[#86868b]">
              Peak delivery orders occur between 11:30 AM – 2:00 PM for lunch surprises.
            </p>
            <div className="h-32 flex items-end justify-between pt-4 border-b border-neutral-100 px-2">
              {rushHours.map((rh, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5 w-8">
                  <span className="text-[10px] font-medium text-[#1d1d1f]">{rh.orders}</span>
                  <div
                    className="w-full bg-[#1d1d1f] rounded-t-sm transition-all duration-500"
                    style={{ height: rh.height }}
                  />
                  <span className="text-[10px] text-[#86868b]">{rh.hour}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Selling Arrangements Leaderboard */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-[#1d1d1f] flex items-center gap-2">
              <Award className="w-4 h-4 text-neutral-600" /> Best-Selling Bouquets
            </h3>
            <div className="divide-y divide-neutral-100">
              {topProducts.length === 0 ? (
                <p className="text-xs text-[#86868b] py-6 text-center">No sales recorded yet</p>
              ) : (
                topProducts.slice(0, 4).map((p, idx) => (
                  <div key={p.product_id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#f5f5f7] text-[#1d1d1f] font-medium flex items-center justify-center text-[10px] border border-neutral-200/60">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-[#1d1d1f] truncate max-w-[130px]">{p.product_name}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-medium text-[#1d1d1f] block">{formatPrice(p.total_revenue_generated)}</span>
                      <span className="text-[10px] text-[#86868b]">{p.total_quantity_sold} sold</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Promo Code & Discounts Management */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-semibold text-[#1d1d1f] flex items-center gap-2">
              <Tag className="w-4 h-4 text-neutral-600" /> Active Marketing Promotional Codes
            </h3>
            <p className="text-xs text-[#86868b] mt-0.5">
              Discount codes applied by customers during Philippine express checkout.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f5f5f7]/80 text-[#86868b] uppercase tracking-wider text-[10px] font-semibold border-b border-neutral-200/70">
                <tr>
                  <th className="p-3 font-semibold">Code</th>
                  <th className="p-3 font-semibold">Type</th>
                  <th className="p-3 font-semibold">Discount Value</th>
                  <th className="p-3 font-semibold">Min Spend</th>
                  <th className="p-3 font-semibold">Redemptions</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="p-3 font-mono font-semibold text-[#1d1d1f]">{d.code}</td>
                    <td className="p-3 capitalize">{d.discount_type}</td>
                    <td className="p-3 font-medium text-[#1d1d1f]">
                      {d.discount_type === 'percentage' ? `${d.value}% Off` : `${formatPrice(d.value)} Off`}
                    </td>
                    <td className="p-3">{formatPrice(d.min_spend)}</td>
                    <td className="p-3 font-mono text-[#86868b]">{d.used_count} times</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 font-medium text-[11px] px-2.5 py-0.5 rounded-full ${
                        d.is_active === 1 ? 'bg-emerald-50 text-emerald-800' : 'bg-neutral-100 text-[#86868b]'
                      }`}>
                        {d.is_active === 1 ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-neutral-400" />}
                        {d.is_active === 1 ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleDiscount(d.id)}
                        className="text-xs font-medium text-[#1d1d1f] hover:underline cursor-pointer"
                      >
                        {d.is_active === 1 ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* New Promo Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200/80 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80">
              <h4 className="text-base font-semibold text-[#1d1d1f]">Create New Promo Code</h4>
              <button
                onClick={() => setShowPromoModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePromo} className="space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-[#1d1d1f] block mb-1.5">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH25"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full p-2.5 border border-neutral-200/80 rounded-xl bg-[#f5f5f7] uppercase font-mono font-semibold text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-medium text-[#1d1d1f] block mb-1.5">Discount Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full p-2.5 border border-neutral-200/80 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Peso (₱)</option>
                  </select>
                </div>
                <div>
                  <label className="font-medium text-[#1d1d1f] block mb-1.5">Value</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-full p-2.5 border border-neutral-200/80 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-[#1d1d1f] block mb-1.5">Minimum Spend (₱)</label>
                <input
                  type="number"
                  step="1"
                  value={newMinSpend}
                  onChange={(e) => setNewMinSpend(e.target.value)}
                  className="w-full p-2.5 border border-neutral-200/80 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              {promoError && (
                <p className="text-xs text-rose-600">{promoError}</p>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#1d1d1f] hover:bg-black text-white font-medium text-xs rounded-full transition-all cursor-pointer shadow-xs"
                >
                  Create Code
                </button>
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="py-3 px-5 border border-neutral-200/80 rounded-full text-[#1d1d1f] text-xs font-medium hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
