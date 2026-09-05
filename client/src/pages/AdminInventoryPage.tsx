import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';
import { formatPrice } from '../utils/format';
import { Package, AlertTriangle, Plus, Search, Check, RefreshCw } from 'lucide-react';

const FALLBACK_FLORAL_IMAGE = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80';

export const AdminInventoryPage: React.FC = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [restockSuccessId, setRestockSuccessId] = useState<number | null>(null);

  const fetchProducts = () => {
    if (!token) return;
    setLoading(true);

    fetch('/api/products')
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
  }, [token]);

  const handleQuickRestock = async (product: Product, addAmount: number) => {
    const newStock = product.stock + addAmount;
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ stock: newStock })
      });
      if (res.ok) {
        setRestockSuccessId(product.id);
        setTimeout(() => setRestockSuccessId(null), 1500);
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLowStock = filterLowStockOnly ? p.stock <= p.min_stock_alert : true;
    return matchesSearch && matchesLowStock;
  });

  const lowStockCount = products.filter((p) => p.stock <= p.min_stock_alert).length;
  const totalUnits = products.reduce((s, p) => s + p.stock, 0);

  return (
    <div className="min-h-screen bg-[#fbfbfd] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-[11px] font-medium">
              <Package className="w-3.5 h-3.5 text-neutral-600" />
              <span>Botanical Inventory & Fresh Stem Levels</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] mt-1.5">
              Inventory Management
            </h1>
            <p className="text-xs text-[#86868b] mt-0.5">
              Track stem allocations, trigger morning restocks, and monitor low inventory warnings in Philippine Pesos (PHP).
            </p>
          </div>

          <div className="flex gap-2.5">
            <div className="bg-white px-4 py-2.5 rounded-2xl border border-neutral-200/80 shadow-xs text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#86868b] block font-semibold">Total Units</span>
              <span className="font-semibold text-[#1d1d1f] font-mono text-base">{totalUnits}</span>
            </div>
            <div className="bg-white px-4 py-2.5 rounded-2xl border border-neutral-200/80 shadow-xs text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#86868b] block font-semibold">Low Stock Alerts</span>
              <span className={`font-semibold font-mono text-base ${lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {lowStockCount}
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-3 sm:p-4 rounded-3xl border border-neutral-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search bouquet title or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-neutral-200/80 rounded-full bg-[#f5f5f7] text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black transition-all"
            />
            <Search className="w-4 h-4 text-[#86868b] absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
              className={`px-3.5 py-1.5 rounded-full font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                filterLowStockOnly
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-[#f5f5f7] border-neutral-200/80 text-neutral-700 hover:bg-neutral-200/70'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Stock Alerts Only ({lowStockCount})</span>
            </button>

            <button
              onClick={fetchProducts}
              className="p-2 border border-neutral-200/80 rounded-full hover:bg-neutral-50 transition-colors cursor-pointer text-neutral-600 shadow-2xs"
              title="Refresh inventory"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f5f5f7]/80 text-[#86868b] uppercase tracking-wider text-[10px] font-semibold border-b border-neutral-200/70">
                <tr>
                  <th className="p-4 font-semibold">Arrangement</th>
                  <th className="p-4 font-semibold">SKU</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Price</th>
                  <th className="p-4 font-semibold">Cost Price</th>
                  <th className="p-4 font-semibold">Stock on Hand</th>
                  <th className="p-4 font-semibold">Quick Restock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {filtered.map((p) => {
                  const isLow = p.stock <= p.min_stock_alert;
                  const isSuccess = restockSuccessId === p.id;
                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images[0] || FALLBACK_FLORAL_IMAGE}
                            alt={p.name}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_FLORAL_IMAGE; }}
                            className="w-10 h-10 rounded-xl object-cover border border-neutral-200/80 shrink-0 bg-neutral-100"
                          />
                          <div>
                            <span className="font-medium text-[#1d1d1f] block">{p.name}</span>
                            <span className="text-[10px] text-[#86868b] truncate max-w-xs block mt-0.5">
                              {p.flower_types?.slice(0, 3).join(', ')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-neutral-600">{p.sku}</td>
                      <td className="p-4 text-neutral-600">{p.category_name}</td>
                      <td className="p-4 font-semibold text-[#1d1d1f] font-mono">{formatPrice(p.price)}</td>
                      <td className="p-4 text-[#86868b] font-mono">{formatPrice(p.cost_price)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 font-medium px-2.5 py-1 rounded-full text-[11px] ${
                          p.stock === 0
                            ? 'bg-rose-100 text-rose-800'
                            : isLow
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-50 text-emerald-800'
                        }`}>
                          {isLow && <AlertTriangle className="w-3 h-3 text-amber-700" />}
                          {p.stock} units
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleQuickRestock(p, 5)}
                            className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-full text-xs transition-colors cursor-pointer"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => handleQuickRestock(p, 10)}
                            className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-full text-xs transition-colors cursor-pointer"
                          >
                            +10
                          </button>
                          {isSuccess && (
                            <span className="text-emerald-600 font-medium flex items-center gap-0.5 text-xs ml-1">
                              <Check className="w-3.5 h-3.5" /> Restocked!
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
