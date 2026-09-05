import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Order, OrderStatus } from '../types';
import {
  Kanban,
  Printer,
  ChevronRight,
  Filter,
  Gift,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export const AdminOrdersPage: React.FC = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'web' | 'pos'>('all');
  const [selectedOrderForSlip, setSelectedOrderForSlip] = useState<Order | null>(null);

  const fetchOrders = () => {
    if (!token) return;
    setLoading(true);

    fetch('/api/orders', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.orders || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleAdvanceStatus = async (orderId: number, nextStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const columns: { status: OrderStatus; title: string; color: string; next?: OrderStatus; nextLabel?: string }[] = [
    { status: 'pending', title: '1. New Orders', color: 'border-amber-400 bg-amber-50/50', next: 'arranging', nextLabel: 'Start Studio Arranging' },
    { status: 'arranging', title: '2. In Studio Assembly', color: 'border-indigo-400 bg-indigo-50/50', next: 'ready_for_pickup', nextLabel: 'Quality Check & Ready' },
    { status: 'ready_for_pickup', title: '3. Ready for Dispatch', color: 'border-blue-400 bg-blue-50/50', next: 'out_for_delivery', nextLabel: 'Hand to Courier' },
    { status: 'out_for_delivery', title: '4. Out for Delivery', color: 'border-purple-400 bg-purple-50/50', next: 'delivered', nextLabel: 'Confirm Delivered' },
    { status: 'delivered', title: '5. Completed & Delivered', color: 'border-emerald-500 bg-emerald-50/50' }
  ];

  const filteredOrders = orders.filter((o) => {
    if (sourceFilter === 'all') return true;
    return o.source === sourceFilter;
  });

  return (
    <div className="min-h-screen bg-[#fbfbfd] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-[11px] font-medium">
              <Kanban className="w-3.5 h-3.5 text-neutral-600" />
              <span>Florist Atelier Fulfillment Pipeline</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] mt-1.5">
              Assembly & Delivery Pipeline
            </h1>
            <p className="text-xs text-[#86868b] mt-0.5">
              Advance customer arrangements from incoming request to studio assembly, courier pickup, and doorstep presentation.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Filter by source - Apple segmented control */}
            <div className="flex items-center bg-[#f5f5f7] p-1 rounded-full border border-neutral-200/80 text-xs">
              <span className="pl-2.5 pr-1 text-[#86868b] font-medium flex items-center gap-1 text-[11px]">
                <Filter className="w-3 h-3" />
                <span>Source:</span>
              </span>
              <button
                onClick={() => setSourceFilter('all')}
                className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                  sourceFilter === 'all'
                    ? 'bg-white text-[#1d1d1f] shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                All ({orders.length})
              </button>
              <button
                onClick={() => setSourceFilter('web')}
                className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                  sourceFilter === 'web'
                    ? 'bg-white text-[#1d1d1f] shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                Web
              </button>
              <button
                onClick={() => setSourceFilter('pos')}
                className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                  sourceFilter === 'pos'
                    ? 'bg-white text-[#1d1d1f] shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                Counter POS
              </button>
            </div>

            <button
              onClick={fetchOrders}
              className="px-3.5 py-1.5 bg-white border border-neutral-200/80 text-[#1d1d1f] text-xs font-medium rounded-full shadow-xs hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              Refresh Board
            </button>
          </div>
        </div>

        {/* Kanban Board Columns */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-96 bg-white rounded-3xl border border-neutral-200/70 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
            {columns.map((col) => {
              const colOrders = filteredOrders.filter((o) => o.status === col.status);
              return (
                <div
                  key={col.status}
                  className="rounded-3xl bg-[#f5f5f7]/70 border border-neutral-200/70 p-3.5 min-h-[560px] flex flex-col"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-200/60">
                    <span className="text-xs font-semibold text-[#1d1d1f]">
                      {col.title}
                    </span>
                    <span className="text-[11px] font-mono font-medium bg-white text-neutral-700 px-2 py-0.5 rounded-full shadow-2xs border border-neutral-200/60">
                      {colOrders.length}
                    </span>
                  </div>

                  {/* Cards inside column */}
                  <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                    {colOrders.length === 0 ? (
                      <div className="text-center py-12 text-[11px] text-[#86868b]">
                        No orders in this phase
                      </div>
                    ) : (
                      colOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-xs hover:border-black/20 hover:shadow-md transition-all space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div>
                              <span className="text-[10px] font-mono text-[#86868b] tracking-wider uppercase block">
                                {ord.order_number}
                              </span>
                              <h5 className="font-semibold text-xs text-[#1d1d1f] mt-0.5">
                                {ord.recipient_name || ord.customer_name}
                              </h5>
                            </div>

                            <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200/60">
                              {ord.source.toUpperCase()}
                            </span>
                          </div>

                          {/* Items summary */}
                          {ord.items && ord.items.length > 0 && (
                            <div className="p-2.5 bg-[#f5f5f7] rounded-xl text-[11px] space-y-1">
                              {ord.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between font-medium text-[#1d1d1f]">
                                  <span className="truncate max-w-[130px]">{it.quantity}x {it.product_name}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Card message snippet if present */}
                          {ord.card_message && (
                            <div className="text-[10px] text-neutral-700 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/50 line-clamp-2 italic">
                              "{ord.card_message}"
                            </div>
                          )}

                          <div className="text-[10px] text-[#86868b] space-y-0.5 pt-1.5 border-t border-neutral-100">
                            <p>Slot: <strong className="text-[#1d1d1f] font-medium">{ord.delivery_time_slot || 'Standard Dispatch'}</strong></p>
                            <p className="truncate">Addr: {ord.delivery_address || 'Store Pickup'}</p>
                            <p className="font-semibold text-[#1d1d1f] text-xs pt-0.5">Total: ${ord.total.toFixed(2)}</p>
                          </div>

                          {/* Actions: Print Florist Slip & Advance Status */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              onClick={() => setSelectedOrderForSlip(ord)}
                              className="p-2 text-[#86868b] hover:text-[#1d1d1f] border border-neutral-200/80 rounded-full bg-white hover:bg-neutral-50 transition-colors cursor-pointer shadow-2xs"
                              title="Print Florist Arrangement Work Slip"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {col.next && (
                              <button
                                onClick={() => handleAdvanceStatus(ord.id, col.next!)}
                                className="flex-1 py-1.5 px-3 bg-[#1d1d1f] hover:bg-black text-white font-medium text-[10px] rounded-full shadow-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                <span>{col.nextLabel}</span>
                                <ChevronRight className="w-3 h-3 text-neutral-400" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Florist Studio Assembly Slip Modal */}
      {selectedOrderForSlip && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200/80 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80">
              <span className="font-semibold text-sm text-[#1d1d1f] flex items-center gap-2">
                <Gift className="w-4 h-4 text-neutral-700" /> Florist Studio Arrangement Recipe & Slip
              </span>
              <button
                onClick={() => setSelectedOrderForSlip(null)}
                className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#f5f5f7] p-5 rounded-2xl border border-neutral-200/70 font-mono text-xs space-y-3.5">
              <div className="text-center pb-3 border-b border-dashed border-neutral-300">
                <h4 className="font-sans font-semibold text-sm text-[#1d1d1f] tracking-tight">FLORAL K STUDIO RECIPE TICKET</h4>
                <p className="text-[10px] text-[#86868b] mt-0.5">Order Ref: {selectedOrderForSlip.order_number}</p>
                <p className="text-[10px] text-[#86868b]">Delivery Slot: {selectedOrderForSlip.delivery_time_slot || 'Today Express'}</p>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] block mb-0.5">Recipient & Address:</span>
                <p className="font-semibold text-[#1d1d1f] font-sans">{selectedOrderForSlip.recipient_name || selectedOrderForSlip.customer_name}</p>
                <p className="text-neutral-600 font-sans text-[11px]">{selectedOrderForSlip.delivery_address}</p>
                <p className="text-[#86868b] font-sans text-[10px]">Phone: {selectedOrderForSlip.recipient_phone || selectedOrderForSlip.customer_phone}</p>
              </div>

              <div className="pt-2 border-t border-dashed border-neutral-300 space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] block mb-0.5">Arrangements to Assemble:</span>
                {selectedOrderForSlip.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between font-medium text-[#1d1d1f]">
                    <span>{it.quantity}x {it.product_name}</span>
                    <span className="text-neutral-500">SKU: {it.product_sku}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-dashed border-neutral-300">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] block mb-1">
                  Gift Note (To be handwritten in gold ink):
                </span>
                <p className="font-serif italic text-sm text-[#1d1d1f] p-3 bg-white rounded-xl border border-neutral-200">
                  "{selectedOrderForSlip.card_message || 'Complimentary Signature Card'}"
                </p>
              </div>

              <div className="pt-2 border-t border-dashed border-neutral-300 text-[10px] text-[#86868b] flex items-center justify-between font-sans">
                <span>Quality Check: Verified fresh cut</span>
                <span>Signature Wax Seal: Applied</span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-[#1d1d1f] hover:bg-black text-white rounded-full font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" /> Print Florist Slip
              </button>
              <button
                onClick={() => setSelectedOrderForSlip(null)}
                className="py-3 px-5 border border-neutral-200/80 rounded-full text-[#1d1d1f] text-xs font-medium hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
