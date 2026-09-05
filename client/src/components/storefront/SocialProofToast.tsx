import React, { useState, useEffect } from 'react';
import { Sparkles, Users, CheckCircle2 } from 'lucide-react';

interface ToastData {
  name: string;
  location: string;
  item: string;
  timeAgo: string;
}

const SAMPLE_TOASTS: ToastData[] = [
  { name: 'Maria C.', location: 'Bonifacio Global City, Taguig', item: 'The Scarlet Royale (24 Red Roses)', timeAgo: '2 mins ago' },
  { name: 'Gabriel P.', location: 'Salcedo Village, Makati', item: 'Midnight Velvet Peony & Rose Symphony', timeAgo: '5 mins ago' },
  { name: 'Bea R.', location: 'Ayala Alabang, Muntinlupa', item: 'The Imperial Double Orchid Planter', timeAgo: '8 mins ago' },
  { name: 'Kristian D.', location: 'Ortigas Center, Pasig', item: 'Golden Hour Citrus Burst', timeAgo: '12 mins ago' },
  { name: 'Patricia M.', location: 'New Manila, Quezon City', item: 'The Botanist Hamper & Posy Box', timeAgo: '15 mins ago' },
];

export const SocialProofToast: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [viewerCount, setViewerCount] = useState(14);

  useEffect(() => {
    // Initial delay before first toast
    const initialTimer = setTimeout(() => {
      setVisible(true);
    }, 2500);

    // Fluctuate viewer count realistically every 8s
    const viewerInterval = setInterval(() => {
      setViewerCount((prev) => Math.max(9, Math.min(26, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 8000);

    // Cycle through toasts every 7 seconds
    const toastInterval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % SAMPLE_TOASTS.length);
        setVisible(true);
      }, 600);
    }, 7000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(viewerInterval);
      clearInterval(toastInterval);
    };
  }, []);

  const toast = SAMPLE_TOASTS[currentIdx];

  return (
    <div className="fixed bottom-5 left-5 z-40 flex flex-col gap-2 max-w-xs sm:max-w-sm pointer-events-none">
      {/* Live active viewers pill */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xl text-[#1d1d1f] text-[11px] font-normal border border-black/5 shadow-md w-fit">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <Users className="w-3 h-3 text-neutral-500" />
        <span><strong className="font-semibold">{viewerCount} people</strong> viewing blooms now</span>
      </div>

      {/* Recent purchase popup card */}
      <div
        className={`bg-white/95 backdrop-blur-2xl border border-black/5 rounded-2xl p-3 shadow-xl flex items-center gap-3 transition-all duration-500 ease-out transform ${
          visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
        </div>

        <div className="flex-1 min-w-0 text-xs">
          <div className="flex items-center justify-between gap-1">
            <span className="font-semibold text-[#1d1d1f] truncate">
              {toast.name} <span className="font-normal text-neutral-400">in {toast.location}</span>
            </span>
            <span className="text-[10px] text-neutral-400 shrink-0">{toast.timeAgo}</span>
          </div>
          <p className="text-[11px] text-neutral-600 font-sans truncate mt-0.5">
            Ordered {toast.item}
          </p>
        </div>
      </div>
    </div>
  );
};
