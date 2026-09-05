import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/format';
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
  PenTool,
  QrCode,
  Smartphone,
  Store,
  MapPin,
  AlertCircle,
  ShieldCheck,
  Banknote,
  Building2
} from 'lucide-react';

const FALLBACK_FLORAL_IMAGE = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80';

interface CartDrawerProps {
  onOrderSuccess: (orderNumber: string) => void;
}

type PaymentMethodType = 'qrph' | 'gcash' | 'maya' | 'card' | 'cod';

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

  // Philippine Payment & Pickup Options
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('qrph');
  const [pickupBranch, setPickupBranch] = useState<'bgc' | 'greenbelt'>('bgc');
  const [gcashNumber, setGcashNumber] = useState('');
  const [mayaNumber, setMayaNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [qrReference] = useState(() => 'QRPH-' + Math.floor(100000 + Math.random() * 900000));

  // Customer Contact defaults
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');

  // Guard: When switching to Store Pickup, if payment method was COD, reset to QRPH (prepaid reservation only)
  useEffect(() => {
    if (orderType === 'online_pickup' && paymentMethod === 'cod') {
      setPaymentMethod('qrph');
    }
  }, [orderType, paymentMethod]);

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

    if (!customerName.trim() || !customerPhone.trim()) {
      setCheckoutError('Please provide your name and mobile phone number for order updates');
      return;
    }

    if (orderType === 'online_delivery' && !deliveryAddress.trim()) {
      setCheckoutError('Please provide a Metro Manila delivery street address');
      return;
    }

    // Strict validation: Store pickup requires prepaid reservation
    if (orderType === 'online_pickup' && paymentMethod === 'cod') {
      setCheckoutError('Store Pickup requires a prepaid online reservation (QRPH, GCash, Maya, or Card) to guarantee stem reservation.');
      return;
    }

    if (paymentMethod === 'gcash' && !gcashNumber.trim()) {
      setCheckoutError('Please enter your 11-digit GCash mobile number (e.g. 09171234567)');
      return;
    }

    if (paymentMethod === 'maya' && !mayaNumber.trim()) {
      setCheckoutError('Please enter your Maya account mobile number');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalDeliveryAddress =
        orderType === 'online_pickup'
          ? pickupBranch === 'bgc'
            ? 'Store Pickup: BGC Flagship Atelier (28th St. cor. 7th Ave, BGC, Taguig)'
            : 'Store Pickup: Makati Greenbelt Boutique (Greenbelt 5, Legazpi Village, Makati)'
          : deliveryAddress.trim();

      const payload = {
        items: items.map((it) => ({
          productId: it.product.id,
          quantity: it.quantity
        })),
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: customerPhone.trim(),
        orderType,
        deliveryDate,
        deliveryTimeSlot,
        recipientName: orderType === 'online_delivery' ? (recipientName.trim() || customerName.trim()) : customerName.trim(),
        recipientPhone: orderType === 'online_delivery' ? (recipientPhone.trim() || customerPhone.trim()) : customerPhone.trim(),
        deliveryAddress: finalDeliveryAddress,
        cardMessage,
        discountCode: discountCode || undefined,
        paymentMethod
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

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col">
          
          {/* Drawer Header */}
          <div className="px-6 py-5 bg-white text-[#1d1d1f] flex items-center justify-between border-b border-neutral-200/80">
            <div>
              <h3 className="font-sans text-lg font-semibold flex items-center gap-2">
                <span>{step === 'cart' ? 'Review Your Floral Bag' : 'Order & Payment Details'}</span>
                {items.length > 0 && (
                  <span className="text-[11px] bg-neutral-100 text-neutral-800 px-2.5 py-0.5 rounded-full font-medium">
                    {items.reduce((s, it) => s + it.quantity, 0)} {items.reduce((s, it) => s + it.quantity, 0) === 1 ? 'item' : 'items'}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Handcrafted & chilled in our BGC Atelier • Manila, Philippines
              </p>
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
                  <>Add <strong className="text-black font-semibold">{formatPrice(amountUntilFreeDelivery)}</strong> for Free Metro Manila Delivery</>
                ) : (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Free Chilled Delivery Unlocked!
                  </span>
                )}
              </span>
              <span className="text-[11px] text-neutral-400">{freeShippingProgress}%</span>
            </div>
            <div className="w-full bg-neutral-200/80 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#1d1d1f] h-full rounded-full transition-all duration-300"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {items.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto">
                  <Gift className="w-8 h-8 stroke-[1.5]" />
                </div>
                <div>
                  <h4 className="font-sans text-base font-semibold text-neutral-900">Your bag is empty</h4>
                  <p className="text-xs text-neutral-500 max-w-xs mx-auto mt-1">
                    Explore our botanical collection and send radiant blooms across Metro Manila today.
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 rounded-full bg-[#1d1d1f] text-white text-xs font-medium hover:bg-black cursor-pointer transition-all"
                >
                  Browse Fresh Blooms
                </button>
              </div>
            ) : step === 'cart' ? (
              <>
                {/* Cart Items List */}
                <div className="divide-y divide-neutral-100 space-y-3">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="pt-3 flex gap-3.5 items-center">
                      <img
                        src={product.images[0] || FALLBACK_FLORAL_IMAGE}
                        alt={product.name}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_FLORAL_IMAGE; }}
                        className="w-16 h-16 rounded-2xl object-cover border border-neutral-200/80 shrink-0 bg-neutral-100"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-semibold text-neutral-900 truncate">
                          {product.name}
                        </h5>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {formatPrice(product.price)} each
                        </p>
                        
                        {/* Stepper & remove */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border border-neutral-200 rounded-full bg-neutral-50 p-0.5">
                            <button
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              className="p-1 text-neutral-600 hover:text-black cursor-pointer rounded-full"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-xs font-semibold">{quantity}</span>
                            <button
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              className="p-1 text-neutral-600 hover:text-black cursor-pointer rounded-full"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(product.id)}
                            className="text-neutral-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-right font-semibold text-xs text-neutral-900 shrink-0">
                        {formatPrice(product.price * quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Handwritten Gift Note Composer with Font Styles & Live Calligraphy Preview */}
                <div className="bg-neutral-50/80 border border-neutral-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-neutral-700" /> Complimentary Artisan Gift Card
                    </span>
                    <div className="flex gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setCardFontStyle('cursive')}
                        className={`px-2 py-0.5 rounded-full cursor-pointer transition-all ${cardFontStyle === 'cursive' ? 'bg-[#1d1d1f] text-white font-medium' : 'text-neutral-500 hover:text-black'}`}
                      >
                        Script
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardFontStyle('serif')}
                        className={`px-2 py-0.5 rounded-full cursor-pointer transition-all ${cardFontStyle === 'serif' ? 'bg-[#1d1d1f] text-white font-medium' : 'text-neutral-500 hover:text-black'}`}
                      >
                        Serif
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardFontStyle('sans')}
                        className={`px-2 py-0.5 rounded-full cursor-pointer transition-all ${cardFontStyle === 'sans' ? 'bg-[#1d1d1f] text-white font-medium' : 'text-neutral-500 hover:text-black'}`}
                      >
                        Modern
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={cardMessage}
                    onChange={(e) => setCardMessage(e.target.value)}
                    placeholder="Write a heartfelt card message to the recipient..."
                    className="w-full text-xs p-3 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-1 focus:ring-black text-neutral-800"
                  />

                  {/* Live Calligraphy Note Preview with Wax Seal Element */}
                  {cardMessage && (
                    <div className="bg-[#FAF6EE] border border-amber-200/60 rounded-xl p-3.5 shadow-inner relative overflow-hidden">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] uppercase tracking-widest text-amber-800/80 font-semibold block">
                          Card Inscription Preview:
                        </span>
                        <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-amber-600" /> Gold Wax Seal Enclosed
                        </span>
                      </div>
                      <p
                        className={`text-neutral-900 leading-snug ${
                          cardFontStyle === 'cursive'
                            ? 'font-serif italic text-base text-[#1d1d1f]'
                            : cardFontStyle === 'serif'
                            ? 'font-serif text-xs italic text-[#1d1d1f]'
                            : 'font-sans text-xs font-normal text-[#1d1d1f]'
                        }`}
                      >
                        &ldquo;{cardMessage}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                {/* Promo Code Input */}
                <form onSubmit={handleApplyPromo} className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo code (e.g. WELCOME10)"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 text-xs border border-neutral-200 rounded-xl bg-neutral-50 uppercase focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-[#1d1d1f] text-white rounded-xl text-xs font-medium hover:bg-black cursor-pointer transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && <p className="text-[11px] text-rose-600">{promoError}</p>}
                  {discountCode && (
                    <div className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-2 rounded-xl">
                      <span>Applied: <strong>{discountCode}</strong> (-{formatPrice(discountAmount)})</span>
                      <button onClick={removeDiscountCode} className="text-rose-600 hover:underline cursor-pointer font-medium">
                        Remove
                      </button>
                    </div>
                  )}
                </form>
              </>
            ) : (
              /* Checkout Details Step */
              <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-5 text-xs">
                {checkoutError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                {/* 1. Fulfillment Type Toggle */}
                <div className="space-y-2">
                  <label className="font-semibold text-neutral-800 block text-[11px] uppercase tracking-wider">
                    Fulfillment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderType('online_delivery')}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                        orderType === 'online_delivery'
                          ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-xs'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200/80 hover:bg-neutral-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Truck className="w-4 h-4" />
                        <span className="font-semibold text-xs">Chilled Delivery</span>
                      </div>
                      <span className={`text-[10px] block ${orderType === 'online_delivery' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                        Metro Manila Courier
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrderType('online_pickup')}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                        orderType === 'online_pickup'
                          ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-xs'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200/80 hover:bg-neutral-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Store className="w-4 h-4" />
                        <span className="font-semibold text-xs">Store Pickup</span>
                      </div>
                      <span className={`text-[10px] block ${orderType === 'online_pickup' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                        BGC or Makati Atelier
                      </span>
                    </button>
                  </div>
                </div>

                {/* Store Pickup Branch & Reservation Notice */}
                {orderType === 'online_pickup' && (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-xs">
                        <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Florist Reservation Policy</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Every stem is custom conditioned and cut 1 hour prior to pickup. To guarantee stem availability and prevent florist bouquet ghosting, store pickups require <strong>prepaid online reservation</strong> (QRPH, GCash, Maya, or Card). COD is strictly disabled for pickup.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-neutral-800 block text-[11px] uppercase tracking-wider">
                        Select Pickup Atelier
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          type="button"
                          onClick={() => setPickupBranch('bgc')}
                          className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 cursor-pointer transition-all ${
                            pickupBranch === 'bgc'
                              ? 'border-neutral-900 bg-neutral-50'
                              : 'border-neutral-200 bg-white hover:bg-neutral-50'
                          }`}
                        >
                          <Building2 className="w-4 h-4 text-neutral-600 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-semibold text-xs block text-neutral-900">BGC Flagship Atelier</span>
                            <span className="text-[11px] text-neutral-500 block">28th St. cor. 7th Ave, Bonifacio Global City, Taguig</span>
                            <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">Ready in 2 hours • Daily 8:00 AM - 8:00 PM</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPickupBranch('greenbelt')}
                          className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 cursor-pointer transition-all ${
                            pickupBranch === 'greenbelt'
                              ? 'border-neutral-900 bg-neutral-50'
                              : 'border-neutral-200 bg-white hover:bg-neutral-50'
                          }`}
                        >
                          <Building2 className="w-4 h-4 text-neutral-600 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-semibold text-xs block text-neutral-900">Makati Greenbelt Boutique</span>
                            <span className="text-[11px] text-neutral-500 block">Greenbelt 5, Legazpi Village, Makati City</span>
                            <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">Ready in 3 hours • Daily 10:00 AM - 9:00 PM</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Customer Contact Information */}
                <div className="space-y-2">
                  <label className="font-semibold text-neutral-800 block text-[11px] uppercase tracking-wider">
                    Your Contact Details
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2.5 border border-neutral-200 rounded-xl bg-neutral-50 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="tel"
                      required
                      placeholder="Mobile (+63 9XX-XXX-XXXX)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full p-2.5 border border-neutral-200 rounded-xl bg-neutral-50 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    <input
                      type="email"
                      placeholder="Email (for e-receipt)"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full p-2.5 border border-neutral-200 rounded-xl bg-neutral-50 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>

                {/* 3. Delivery Date & Time Slot */}
                <div className="space-y-2">
                  <label className="font-semibold text-neutral-800 block text-[11px] uppercase tracking-wider">
                    {orderType === 'online_delivery' ? 'Delivery Schedule' : 'Pickup Schedule'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      required
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full p-2.5 border border-neutral-200 rounded-xl bg-neutral-50 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    <select
                      value={deliveryTimeSlot}
                      onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                      className="w-full p-2.5 border border-neutral-200 rounded-xl bg-neutral-50 focus:outline-none focus:ring-1 focus:ring-black"
                    >
                      <option>Same-Day Express (2:00 PM - 5:00 PM)</option>
                      <option>Morning Slot (9:00 AM - 12:00 PM)</option>
                      <option>Afternoon Slot (1:00 PM - 4:00 PM)</option>
                      <option>Evening Twilight (5:00 PM - 8:00 PM)</option>
                    </select>
                  </div>
                </div>

                {/* 4. Recipient Details if Delivery */}
                {orderType === 'online_delivery' && (
                  <div className="space-y-2">
                    <label className="font-semibold text-neutral-800 block text-[11px] uppercase tracking-wider flex items-center justify-between">
                      <span>Recipient & Destination</span>
                      <span className="text-[10px] text-neutral-400 font-normal">Metro Manila Area</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Recipient Name (leave empty if self)"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="w-full p-2.5 border border-neutral-200 rounded-xl bg-neutral-50 focus:outline-none focus:ring-1 focus:ring-black"
                      />
                      <input
                        type="tel"
                        placeholder="Recipient Phone"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        className="w-full p-2.5 border border-neutral-200 rounded-xl bg-neutral-50 focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Street Address, Unit / Condo / Landmark (e.g. One Serendra, BGC, Taguig)"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full p-2.5 border border-neutral-200 rounded-xl bg-neutral-50 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    <p className="text-[10px] text-neutral-400">
                      Delivered in custom chilled flower boxes across Taguig, Makati, Pasig, Mandaluyong, QC, San Juan, Manila & Parañaque.
                    </p>
                  </div>
                )}

                {/* 5. Philippine Payment Method Selector */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-neutral-800 block text-[11px] uppercase tracking-wider">
                      Payment Method
                    </label>
                    <span className="text-[10px] text-neutral-400">Philippine Pesos (PHP)</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* QRPH Button */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('qrph')}
                      className={`p-2.5 rounded-2xl border text-center cursor-pointer transition-all ${
                        paymentMethod === 'qrph'
                          ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-xs'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200/80 hover:bg-neutral-100'
                      }`}
                    >
                      <QrCode className="w-4 h-4 mx-auto mb-1" />
                      <span className="text-xs font-semibold block">QRPH</span>
                      <span className={`text-[9px] block ${paymentMethod === 'qrph' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                        Instant Scan
                      </span>
                    </button>

                    {/* GCash Button */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('gcash')}
                      className={`p-2.5 rounded-2xl border text-center cursor-pointer transition-all ${
                        paymentMethod === 'gcash'
                          ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-xs'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200/80 hover:bg-neutral-100'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 mx-auto mb-1" />
                      <span className="text-xs font-semibold block">GCash</span>
                      <span className={`text-[9px] block ${paymentMethod === 'gcash' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                        E-Wallet
                      </span>
                    </button>

                    {/* Maya Button */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('maya')}
                      className={`p-2.5 rounded-2xl border text-center cursor-pointer transition-all ${
                        paymentMethod === 'maya'
                          ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-xs'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200/80 hover:bg-neutral-100'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 mx-auto mb-1" />
                      <span className="text-xs font-semibold block">Maya</span>
                      <span className={`text-[9px] block ${paymentMethod === 'maya' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                        E-Wallet
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Card Button */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2.5 rounded-2xl border text-center cursor-pointer transition-all ${
                        paymentMethod === 'card'
                          ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-xs'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200/80 hover:bg-neutral-100'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mx-auto mb-1" />
                      <span className="text-xs font-semibold block">Credit / Debit</span>
                      <span className={`text-[9px] block ${paymentMethod === 'card' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                        Visa / Mastercard
                      </span>
                    </button>

                    {/* COD Button */}
                    <button
                      type="button"
                      disabled={orderType === 'online_pickup'}
                      onClick={() => {
                        if (orderType !== 'online_pickup') {
                          setPaymentMethod('cod');
                        }
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        orderType === 'online_pickup'
                          ? 'opacity-40 bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                          : paymentMethod === 'cod'
                          ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-xs cursor-pointer'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200/80 hover:bg-neutral-100 cursor-pointer'
                      }`}
                    >
                      <Banknote className="w-4 h-4 mx-auto mb-1" />
                      <span className="text-xs font-semibold block">Cash on Delivery</span>
                      <span className={`text-[9px] block ${orderType === 'online_pickup' ? 'text-rose-500' : paymentMethod === 'cod' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                        {orderType === 'online_pickup' ? 'Disabled for Pickup' : 'Metro Manila Only'}
                      </span>
                    </button>
                  </div>

                  {/* Payment Method Details Panel */}
                  <div className="p-4 bg-neutral-50 border border-neutral-200/80 rounded-2xl space-y-3">
                    {paymentMethod === 'qrph' && (
                      <div className="space-y-3 text-center">
                        <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                          <span className="text-[11px] font-semibold text-neutral-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Bangko Sentral ng Pilipinas QRPH
                          </span>
                          <span className="text-[10px] text-neutral-500">InstaPay / PesoNet</span>
                        </div>

                        {/* Interactive QR Display */}
                        <div className="bg-white p-3.5 rounded-xl border border-neutral-200/90 inline-block shadow-xs">
                          <div className="w-36 h-36 bg-neutral-900 rounded-lg flex flex-col items-center justify-center p-2 relative overflow-hidden">
                            {/* Stylish mock QR pattern with center floral badge */}
                            <div className="grid grid-cols-5 gap-1.5 w-full h-full opacity-90 p-1">
                              {Array.from({ length: 25 }).map((_, idx) => (
                                <div
                                  key={idx}
                                  className={`rounded-xs ${
                                    idx === 12
                                      ? 'bg-amber-400'
                                      : (idx % 2 === 0 || idx % 3 === 0)
                                      ? 'bg-white'
                                      : 'bg-neutral-800'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="bg-white px-1.5 py-0.5 rounded shadow-sm text-[8px] font-black tracking-widest text-[#1d1d1f]">
                                QRPH
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-neutral-900">Scan to Pay {formatPrice(total)}</p>
                          <p className="text-[10px] text-neutral-500 mt-0.5">
                            Open GCash, Maya, BDO, BPI, UnionBank, or any banking app to scan
                          </p>
                          <p className="text-[9px] font-mono text-neutral-400 mt-1">
                            Reference: {qrReference}
                          </p>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'gcash' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-neutral-900">GCash Direct Express</span>
                          <span className="text-[10px] text-neutral-400">Instant Approval</span>
                        </div>
                        <input
                          type="tel"
                          required
                          placeholder="0917-XXX-XXXX (GCash Registered Mobile)"
                          value={gcashNumber}
                          onChange={(e) => setGcashNumber(e.target.value)}
                          className="w-full p-2.5 border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-black"
                        />
                        <p className="text-[10px] text-neutral-500">
                          You will receive an OTP prompt to authorize {formatPrice(total)} on your GCash wallet.
                        </p>
                      </div>
                    )}

                    {paymentMethod === 'maya' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-neutral-900">Maya Digital Checkout</span>
                          <span className="text-[10px] text-neutral-400">Instant Approval</span>
                        </div>
                        <input
                          type="tel"
                          required
                          placeholder="0918-XXX-XXXX (Maya Registered Mobile)"
                          value={mayaNumber}
                          onChange={(e) => setMayaNumber(e.target.value)}
                          className="w-full p-2.5 border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-black"
                        />
                        <p className="text-[10px] text-neutral-500">
                          Quick link to your Maya account for 1-tap seamless verification.
                        </p>
                      </div>
                    )}

                    {paymentMethod === 'card' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-neutral-900">Credit or Debit Card</span>
                          <span className="text-[10px] text-neutral-400">Visa / Mastercard / JCB</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Card Number (4111 2222 3333 4444)"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full p-2.5 border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-black"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full p-2.5 border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-black"
                          />
                          <input
                            type="text"
                            placeholder="CVV"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="w-full p-2.5 border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-black"
                          />
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'cod' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900">
                          <Banknote className="w-4 h-4 text-emerald-700" />
                          <span>Cash on Delivery (Courier Hand-off)</span>
                        </div>
                        <p className="text-[11px] text-neutral-600 leading-relaxed">
                          Please prepare exact amount of <strong>{formatPrice(total)}</strong> in cash for our refrigerated delivery driver upon receiving your bouquet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Drawer Footer: Financial Breakdown & Primary Action */}
          {items.length > 0 && (
            <div className="p-6 bg-neutral-50 border-t border-neutral-200 space-y-3.5">
              <div className="space-y-1.5 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-neutral-900">{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Promotional Discount</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Fulfillment ({orderType === 'online_pickup' ? 'Atelier Pickup' : 'Chilled Courier'})</span>
                  <span>{deliveryFee === 0 ? <strong className="text-emerald-700">FREE</strong> : formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>12% EVAT (BIR Compliant)</span>
                  <span className="font-medium text-neutral-900">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-[#1d1d1f] pt-2 border-t border-neutral-200/80">
                  <span>Total Due</span>
                  <span className="text-lg font-bold">{formatPrice(total)}</span>
                </div>
              </div>

              {step === 'cart' ? (
                <button
                  onClick={() => setStep('checkout')}
                  className="w-full py-3.5 px-4 rounded-full bg-[#1d1d1f] hover:bg-black text-white font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
                >
                  <span>Proceed to Philippine Checkout</span>
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('cart')}
                    className="py-3.5 px-5 rounded-full border border-neutral-300 bg-white text-neutral-700 font-medium text-xs hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 px-4 rounded-full bg-[#1d1d1f] hover:bg-black text-white font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Placing Order...</span>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Place Order • {formatPrice(total)}</span>
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
