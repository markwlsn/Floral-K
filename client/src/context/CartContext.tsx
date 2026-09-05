import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types';
import confetti from 'canvas-confetti';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  itemCount: number;
  subtotal: number;
  discountCode: string;
  discountAmount: number;
  applyDiscountCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  removeDiscountCode: () => void;
  deliveryFee: number;
  tax: number;
  total: number;
  freeDeliveryThreshold: number;
  amountUntilFreeDelivery: number;
  // Delivery & card customizations
  cardMessage: string;
  setCardMessage: (msg: string) => void;
  deliveryDate: string;
  setDeliveryDate: (date: string) => void;
  deliveryTimeSlot: string;
  setDeliveryTimeSlot: (slot: string) => void;
  orderType: 'online_delivery' | 'online_pickup';
  setOrderType: (type: 'online_delivery' | 'online_pickup') => void;
  recipientName: string;
  setRecipientName: (name: string) => void;
  recipientPhone: string;
  setRecipientPhone: (phone: string) => void;
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
  triggerConfetti: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('floralk_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [discountCode, setDiscountCode] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Delivery & Personalization State
  const [cardMessage, setCardMessage] = useState<string>('Wishing you breathtaking joy, radiant beauty, and endless happiness. With all my love!');
  const [deliveryDate, setDeliveryDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState<string>('Same-Day Express (2:00 PM - 5:00 PM)');
  const [orderType, setOrderType] = useState<'online_delivery' | 'online_pickup'>('online_delivery');
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');

  const freeDeliveryThreshold = 3000.0;
  const standardDeliveryFee = 150.0;
  const taxRate = 0.12;

  useEffect(() => {
    localStorage.setItem('floralk_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
    setDiscountCode('');
    setDiscountAmount(0);
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const applyDiscountCode = async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/settings/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), subtotal })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid code' };
      }
      setDiscountCode(data.code);
      setDiscountAmount(data.discountAmount);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error validating code' };
    }
  };

  const removeDiscountCode = () => {
    setDiscountCode('');
    setDiscountAmount(0);
  };

  const deliveryFee = orderType === 'online_pickup' || subtotal >= freeDeliveryThreshold ? 0 : standardDeliveryFee;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = parseFloat((taxableAmount * taxRate).toFixed(2));
  const total = parseFloat((taxableAmount + deliveryFee + tax).toFixed(2));
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const amountUntilFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);

  const triggerConfetti = () => {
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#E8927C', '#D4AF37', '#0F382A', '#F7D6D0', '#FF7F50']
    });
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        itemCount,
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
