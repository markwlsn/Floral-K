import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, ShieldCheck, Flame, ArrowRight, HeartHandshake, Smile, Gift, Heart } from 'lucide-react';

interface HeroConciergeProps {
  onFindMatch: (occasion: string, budget: string) => void;
}

export const HeroConcierge: React.FC<HeroConciergeProps> = ({ onFindMatch }) => {
  const [selectedOccasion, setSelectedOccasion] = useState<string>('Romance');
  const [selectedBudget, setSelectedBudget] = useState<string>('any');
  const [selectedTime, setSelectedTime] = useState<string>('today');

  // Live countdown timer to same-day delivery dispatch cutoff
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 2,
    minutes: 41,
    seconds: 30
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 2, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const emotions = [
    { label: 'I Love You', occasion: 'Romance', icon: <Heart className="w-3.5 h-3.5 text-rose-400" /> },
    { label: 'Happy Birthday', occasion: 'Birthday', icon: <Smile className="w-3.5 h-3.5 text-amber-300" /> },
    { label: "I'm Sorry", occasion: 'Sympathy', icon: <HeartHandshake className="w-3.5 h-3.5 text-blue-300" /> },
    { label: 'Congratulations', occasion: 'Celebration', icon: <Sparkles className="w-3.5 h-3.5 text-emerald-300" /> },
    { label: 'Just Because', occasion: 'Romance', icon: <Gift className="w-3.5 h-3.5 text-pink-300" /> }
  ];

  const occasions = [
    { key: 'Romance', label: 'Love & Romance', icon: '🌹', desc: 'Passionate Ecuadorian roses' },
    { key: 'Birthday', label: 'Birthday Cheer', icon: '🎂', desc: 'Vibrant celebratory blooms' },
    { key: 'Sympathy', label: 'Sympathy & Solace', icon: '🕊️', desc: 'Calming serene whites' },
    { key: 'Luxury', label: 'Luxury & Exotic', icon: '👑', desc: 'Double cascade orchids' },
    { key: 'Just Because', label: 'Just Because', icon: '✨', desc: 'Instant mood-brighteners' },
  ];

  const budgets = [
    { key: 'any', label: 'Any Budget' },
    { key: 'under2500', label: 'Under ₱2,500' },
    { key: '2500to4000', label: '₱2,500 – ₱4,000' },
    { key: 'over4000', label: '₱4,000+' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFindMatch(selectedOccasion, selectedBudget);
  };

  const handleEmotionClick = (occ: string) => {
    setSelectedOccasion(occ);
    onFindMatch(occ, selectedBudget);
  };

  return (
    <section className="relative bg-[#000000] text-white pt-14 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute -top-40 right-10 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 left-10 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Attention-Grabbing Apple Hero Narrative */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Live Urgency Countdown Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/10 text-neutral-200 text-xs font-normal backdrop-blur-xl">
              <Clock className="w-3.5 h-3.5 text-neutral-300" />
              <span>Same-Day Cutoff: Order in </span>
              <span className="font-mono bg-white/10 px-2 py-0.5 rounded-md text-white font-semibold tracking-wider">
                {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.08]">
              Breathtaking Blooms. <br />
              <span className="text-neutral-400 font-normal block mt-1">
                Zero Second-Guessing.
              </span>
            </h1>

            <p className="text-neutral-400 text-base sm:text-lg max-w-xl leading-relaxed font-normal">
              Skip the endless scrolling. Our <strong className="text-white font-medium">30-Second Concierge</strong> pairs you with hand-cut luxury arrangements ready for chilled 2-hour courier dispatch across the city.
            </p>

            {/* Quick Emotion Jump Buttons (Maximum Attention & Emotion Targeting) */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium block">
                What do you want to say today?
              </span>
              <div className="flex flex-wrap gap-2">
                {emotions.map((em, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleEmotionClick(em.occasion)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-normal text-neutral-200 transition-all cursor-pointer"
                  >
                    {em.icon}
                    <span>{em.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Trust & Social Proof Badges */}
            <div className="flex flex-wrap items-center gap-6 pt-3 text-xs text-neutral-400">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-semibold">4.98/5</span>
                <span>(3,800+ Metro Manila Reviews)</span>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-300">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                <span>7-Day Freshness Guarantee</span>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-300">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span>2-Hour Courier Window</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive 30-Second Concierge Card (Apple Minimalist Glass) */}
          <div className="lg:col-span-5">
            <div className="bg-white text-[#1d1d1f] rounded-3xl p-6 sm:p-8 shadow-2xl border border-black/5 relative">
              <div className="absolute -top-3 right-6 bg-[#1d1d1f] text-white text-[10px] font-semibold px-3 py-0.8 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1 border border-white/10">
                <Sparkles className="w-3 h-3 text-amber-300" /> Quick-Buy Concierge
              </div>

              <h3 className="text-2xl font-semibold tracking-tight text-[#1d1d1f] mb-1">
                Find The Perfect Flower
              </h3>
              <p className="text-xs text-stone-500 mb-6">
                Pick your occasion below & get matched in seconds.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Step 1: Occasion Selector */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    1. Select Occasion
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {occasions.map((occ) => {
                      const isSelected = selectedOccasion === occ.key;
                      return (
                        <button
                          key={occ.key}
                          type="button"
                          onClick={() => setSelectedOccasion(occ.key)}
                          className={`p-2.5 rounded-2xl text-left transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-sm'
                              : 'bg-neutral-50 text-neutral-700 border-neutral-200/70 hover:bg-neutral-100/80'
                          }`}
                        >
                          <span className="text-base block">{occ.icon}</span>
                          <span className="text-xs font-semibold block leading-tight mt-1">{occ.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Budget Preference */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    2. Target Budget
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-neutral-100 rounded-2xl">
                    {budgets.map((b) => {
                      const isSelected = selectedBudget === b.key;
                      return (
                        <button
                          key={b.key}
                          type="button"
                          onClick={() => setSelectedBudget(b.key)}
                          className={`py-1.5 px-2 text-center rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white text-[#1d1d1f] shadow-xs font-semibold'
                              : 'text-neutral-500 hover:text-[#1d1d1f]'
                          }`}
                        >
                          {b.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 3: Delivery Timing */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    3. Delivery Timing
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 rounded-2xl">
                    {[
                      { key: 'today', label: 'Today (Express)' },
                      { key: 'tomorrow', label: 'Tomorrow' },
                      { key: 'scheduled', label: 'Later Date' }
                    ].map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setSelectedTime(t.key)}
                        className={`py-1.5 px-1 text-center rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          selectedTime === t.key
                            ? 'bg-white text-[#1d1d1f] shadow-xs font-semibold'
                            : 'text-neutral-500 hover:text-[#1d1d1f]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-full bg-[#1d1d1f] hover:bg-black text-white font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
                >
                  <span>Show Best Matches For Me</span>
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <p className="text-[11px] text-center text-neutral-400">
                  Complimentary handwritten card with gold wax seal & satin ribbon included.
                </p>
              </form>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
