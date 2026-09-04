import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Gift,
  Truck,
  Sparkles,
  ArrowRight,
  CreditCard,
  CheckCircle2,
  PenTool
} from 'lucide-react';

interface CartDrawerProps {
  onOrderSuccess: (orderNumber: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOrderSuccess }) => {
  const { user } = useAuth();
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    discountCode,
    discountAmount,
    applyDiscountCode,
    removeDiscountCode,
    deliveryFee,
    tax,
    total,
    freeDeliveryThreshold,
    amountUntilFreeDelivery,
    cardMessage,
    setCardMessage,
    deliveryDate,
    setDeliveryDate,
    deliveryTimeSlot,
    setDeliveryTimeSlot,
    orderType,
    setOrderType,
    recipientName,
    setRecipientName,
    recipientPhone,
    setRecipientPhone,
    deliveryAddress,
    setDeliveryAddress,
    triggerConfetti
  } = useCart();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [cardFontStyle, setCardFontStyle] = useState<'cursive' | 'serif' | 'sans'>('cursive');

  // Customer Contact defaults
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');

  if (!isCartOpen) return null;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    if (!promoInput.trim()) return;
    const res = await applyDiscountCode(promoInput.trim());
    if (!res.success) {
      setPromoError(res.error || 'Invalid promotional code');
    } else {
      setPromoInput('');
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    if (!customerName || !customerPhone) {
      setCheckoutError('Please provide your name and phone number for delivery updates');
      return;
    }

    if (orderType === 'online_delivery' && !deliveryAddress) {
      setCheckoutError('Please provide a delivery street address');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        items: items.map((it) => ({
          productId: it.product.id,
          quantity: it.quantity
        })),
        customerName,
        customerEmail: customerEmail || undefined,
        customerPhone,
        orderType,
        deliveryDate,
        deliveryTimeSlot,
        recipientName: recipientName || customerName,
        recipientPhone: recipientPhone || customerPhone,
        deliveryAddress: orderType === 'online_delivery' ? deliveryAddress : 'Storefront Counter Pickup',
        cardMessage,
        discountCode: discountCode || undefined,
        paymentMethod: 'card'
      };

      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? { Authorization: `Bearer ${localStorage.getItem('floralk_token')}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      // Success!
      triggerConfetti();
      clearCart();
      setIsCartOpen(false);
      onOrderSuccess(data.order.orderNumber);
    } catch (err: any) {
      setCheckoutError(err.message || 'Error completing checkout');
    } finally {
      setIsSubmitting(false);
    }
  };

  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          
          {/* Drawer Header */}
          <div className="px-6 py-5 bg-white text-[#1d1d1f] flex items-center justify-between border-b border-neutral-200/80">
            <div>
              <h3 className="font-sans text-lg font-semibold flex items-center gap-2">
                <span>{step === 'cart' ? 'Review Your Bag' : 'Express Delivery Details'}</span>
                {items.length > 0 && (
                  <span className="text-[11px] bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-full font-medium">
                    {items.reduce((s, it) => s + it.quantity, 0)} items
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">Handcrafted & packed fresh in studio</p>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-neutral-400 hover:text-black p-1.5 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200/70 text-xs">
            <div className="flex items-center justify-between text-neutral-700 font-medium mb-1.5">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-neutral-500" />
                {amountUntilFreeDelivery > 0 ? (
                  <>Add <strong className="text-black font-semibold">${amountUntilFreeDelivery.toFixed(2)}</strong> for Free Express Delivery</>
                ) : (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Free Express Delivery Unlocked!
                  </span>
                )}
              </span>
              <span className="text-[11px] text-neutral-400">{freeShippingProgress}%</span>
            </div>
            <div className="w-full bg-neutral-200/80 h-1 rounded-full overflow-hidden">
              <div
                className="bg-[#1d1d1f] h-full rounded-full transition-all duration-300"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mx-auto">
                  <Gift className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-serif text-lg font-bold text-stone-800">Your bag is empty</h4>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1">
                    Explore our hand-tied bouquets and bring radiant warmth to someone special today.
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-950 text-amber-200 text-xs font-bold shadow-md hover:bg-emerald-900 cursor-pointer"
                >
                  Browse Fresh Blooms
                </button>
              </div>
            ) : step === 'cart' ? (
              <>
                {/* Cart Items List */}
                <div className="divide-y divide-stone-100 space-y-3">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="pt-3 flex gap-3 items-center">
                      <img
                        src={product.images[0] || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23'}
                        alt={product.name}
                        className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-bold text-stone-900 truncate font-serif">
                          {product.name}
                        </h5>
                        <p className="text-[11px] text-stone-500">
                          ${product.price.toFixed(2)} each
                        </p>
                        
                        {/* Stepper & remove */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50">
                            <button
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              className="p-1 text-stone-600 hover:text-stone-900 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-semibold">{quantity}</span>
                            <button
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              className="p-1 text-stone-600 hover:text-stone-900 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(product.id)}
                            className="text-stone-400 hover:text-rose-500 p-1 cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-right font-bold text-xs text-stone-900 shrink-0">
                        ${(product.price * quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Handwritten Gift Note Composer with Font Styles & Live Calligraphy Preview */}
                <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-rose-500" /> Complimentary Artisan Gift Card
                    </span>
                    <div className="flex gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setCardFontStyle('cursive')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${cardFontStyle === 'cursive' ? 'bg-amber-200 text-amber-950 font-bold' : 'text-stone-500'}`}
                      >
                        Script
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardFontStyle('serif')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${cardFontStyle === 'serif' ? 'bg-amber-200 text-amber-950 font-bold' : 'text-stone-500'}`}
                      >
                        Serif
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardFontStyle('sans')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${cardFontStyle === 'sans' ? 'bg-amber-200 text-amber-950 font-bold' : 'text-stone-500'}`}
                      >
                        Modern
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={cardMessage}
                    onChange={(e) => setCardMessage(e.target.value)}
                    placeholder="Write a heartfelt card message..."
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />

                  {/* Live Calligraphy Note Preview with Wax Seal Element */}
                  {cardMessage && (
                    <div className="bg-[#FAF6EE] border border-amber-200/70 rounded-xl p-3 shadow-inner relative overflow-hidden">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] uppercase tracking-widest text-amber-800 font-semibold block">
                          Card Inscription Preview:
                        </span>
                        <span className="text-[9px] bg-amber-200/70 text-amber-900 px-1.5 py-0.5 rounded-full font-bold">
                          Gold Wax Seal Enclosed
                        </span>
                      </div>
                      <p
                        className={`text-emerald-950 leading-snug ${
                          cardFontStyle === 'cursive'
                            ? 'font-script text-xl'
                            : cardFontStyle === 'serif'
                            ? 'font-serif text-sm italic'
                            : 'font-sans text-xs font-medium'
                        }`}
                      >
                        "{cardMessage}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Promo Code Input */}
                <form onSubmit={handleApplyPromo} className="space-y-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo code (e.g. FLORAL10)"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-xl bg-stone-50 uppercase focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && <p className="text-[11px] text-rose-600">{promoError}</p>}
                  {discountCode && (
                    <div className="flex items-center justify-between text-xs bg-emerald-100/60 text-emerald-900 px-3 py-1.5 rounded-lg">
                      <span>Applied: <strong>{discountCode}</strong> (-${discountAmount.toFixed(2)})</span>
                      <button onClick={removeDiscountCode} className="text-rose-600 hover:underline cursor-pointer">
                        Remove
                      </button>
                    </div>
                  )}
                </form>
              </>
            ) : (
              /* Checkout Details Step */
              <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4 text-xs">
                {checkoutError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                    {checkoutError}
                  </div>
                )}

                {/* Order Type Toggle */}
                <div>
                  <label className="font-bold text-stone-700 block mb-1.5">Fulfillment Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderType('online_delivery')}
                      className={`py-2 px-3 rounded-xl border text-center font-semibold cursor-pointer ${
                        orderType === 'online_delivery'
                          ? 'bg-emerald-900 text-white border-emerald-900'
                          : 'bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      Doorstep Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('online_pickup')}
                      className={`py-2 px-3 rounded-xl border text-center font-semibold cursor-pointer ${
                        orderType === 'online_pickup'
                          ? 'bg-emerald-900 text-white border-emerald-900'
                          : 'bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      Atelier Store Pickup
                    </button>
                  </div>
                </div>

                {/* Sender Information */}
                <div className="space-y-2">
                  <label className="font-bold text-stone-700 block">Your Contact Information</label>
                  <input
                    type="text"
                    required
                    placeholder="Your Full Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl bg-stone-50"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="tel"
                      required
                      placeholder="Mobile Phone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-xl bg-stone-50"
                    />
                    <input
                      type="email"
                      placeholder="Email (Optional)"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-xl bg-stone-50"
                    />
                  </div>
                </div>

                {/* Delivery Date & Time Slot */}
                <div className="space-y-2">
                  <label className="font-bold text-stone-700 block">Delivery Scheduling</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      required
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-xl bg-stone-50"
                    />
                    <select
                      value={deliveryTimeSlot}
                      onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-xl bg-stone-50"
                    >
                      <option>Same-Day Express (2:00 PM - 5:00 PM)</option>
                      <option>Evening Twilight (5:00 PM - 8:00 PM)</option>
                      <option>Morning Glow (9:00 AM - 12:00 PM)</option>
                      <option>Afternoon Bloom (1:00 PM - 4:00 PM)</option>
                    </select>
                  </div>
                </div>

                {/* Recipient Details if Delivery */}
                {orderType === 'online_delivery' && (
                  <div className="space-y-2">
                    <label className="font-bold text-stone-700 block">Recipient & Destination</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Recipient Name (if gift)"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="w-full p-2.5 border border-stone-300 rounded-xl bg-stone-50"
                      />
                      <input
                        type="tel"
                        placeholder="Recipient Phone"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        className="w-full p-2.5 border border-stone-300 rounded-xl bg-stone-50"
                      />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Delivery Street Address, Apt, Suite"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-xl bg-stone-50"
                    />
                  </div>
                )}

                {/* Instant Simulated Payment Card */}
                <div className="p-3 bg-stone-100 rounded-xl border border-stone-200">
                  <div className="flex items-center gap-2 font-semibold text-stone-800 mb-1">
                    <CreditCard className="w-4 h-4 text-emerald-800" />
                    <span>Instant Simulated Payment (1-Click Safe Tender)</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Pre-authorized demo tender. No actual financial charge incurred.
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Drawer Footer: Financial Breakdown & Primary Action */}
          {items.length > 0 && (
            <div className="p-6 bg-stone-50 border-t border-stone-200 space-y-3">
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-900">${subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Promotional Discount</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery ({orderType === 'online_pickup' ? 'Pickup' : 'Courier'})</span>
                  <span>{deliveryFee === 0 ? <strong className="text-emerald-700">FREE</strong> : `$${deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (8.25%)</span>
                  <span className="font-medium text-[#1d1d1f]">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-[#1d1d1f] pt-2 border-t border-neutral-200/80">
                  <span>Total Due</span>
                  <span className="text-lg">${total.toFixed(2)}</span>
                </div>
              </div>

              {step === 'cart' ? (
                <button
                  onClick={() => setStep('checkout')}
                  className="w-full py-3.5 px-4 rounded-full bg-[#1d1d1f] hover:bg-black text-white font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
                >
                  <span>Check Out with Express Delivery</span>
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('cart')}
                    className="py-3 px-4 rounded-full border border-neutral-300 bg-white text-neutral-700 font-medium text-xs hover:bg-neutral-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 px-4 rounded-full bg-[#1d1d1f] hover:bg-black text-white font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Processing Order...</span>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Place Order • ${total.toFixed(2)}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
