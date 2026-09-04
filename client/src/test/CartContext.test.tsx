import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CartProvider, useCart } from '../context/CartContext';
import type { Product } from '../types';

const mockProduct: Product = {
  id: 1,
  name: 'The Scarlet Royale (24 Red Roses)',
  slug: 'scarlet-royale',
  sku: 'FK-ROM-001',
  category_id: 1,
  price: 129.0,
  cost_price: 45.0,
  stock: 20,
  min_stock_alert: 5,
  description: 'Two dozen scarlet roses',
  images: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23'],
  flower_types: ['Red Roses'],
  occasion_tags: ['Romance'],
  is_featured: 1,
  is_available: 1
};

const TestCartConsumer: React.FC = () => {
  const { items, addToCart, subtotal, deliveryFee, tax, total, cardMessage, setCardMessage } = useCart();
  return (
    <div>
      <div data-testid="item-count">{items.length}</div>
      <div data-testid="subtotal">{subtotal.toFixed(2)}</div>
      <div data-testid="delivery-fee">{deliveryFee.toFixed(2)}</div>
      <div data-testid="tax">{tax.toFixed(2)}</div>
      <div data-testid="total">{total.toFixed(2)}</div>
      <div data-testid="card-message">{cardMessage}</div>
      <button onClick={() => addToCart(mockProduct, 1)}>Add Once</button>
      <button onClick={() => setCardMessage('Forever Yours, Marcus')}>Update Card</button>
    </div>
  );
};

describe('CartContext & Calculations', () => {
  it('adds items, updates subtotal, and qualifies for free express delivery over $120', async () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    const addButton = screen.getByText('Add Once');

    // Add Scarlet Royale ($129.00)
    act(() => {
      addButton.click();
    });

    expect(screen.getByTestId('item-count')).toHaveTextContent('1');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('129.00');

    // Since $129.00 >= $120.00 free delivery threshold, delivery fee is 0.00!
    expect(screen.getByTestId('delivery-fee')).toHaveTextContent('0.00');

    // Tax is 8.25% of 129.00 = 10.64
    expect(screen.getByTestId('tax')).toHaveTextContent('10.64');

    // Total = 129.00 + 10.64 = 139.64
    expect(screen.getByTestId('total')).toHaveTextContent('139.64');
  });

  it('updates handwritten card message preview state', () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    const updateBtn = screen.getByText('Update Card');
    act(() => {
      updateBtn.click();
    });

    expect(screen.getByTestId('card-message')).toHaveTextContent('Forever Yours, Marcus');
  });
});
