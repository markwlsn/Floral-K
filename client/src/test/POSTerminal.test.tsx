import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POSPage } from '../pages/POSPage';
import { AuthProvider } from '../context/AuthContext';

const mockProducts = [
  {
    id: 1,
    name: 'The Scarlet Royale (24 Red Roses)',
    slug: 'scarlet-royale',
    sku: 'FK-ROM-001',
    category_id: 1,
    category_name: 'Romance & Anniversary',
    price: 129.0,
    cost_price: 45.0,
    stock: 15,
    min_stock_alert: 5,
    description: 'Two dozen velvet Colombian long-stem red roses',
    images: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23'],
    flower_types: ['Roses'],
    occasion_tags: ['Romance'],
    is_featured: 1,
    is_available: 1
  },
  {
    id: 2,
    name: 'Golden Radiance Sunflower Hand-Tie',
    slug: 'golden-radiance',
    sku: 'FK-BDAY-002',
    category_id: 2,
    category_name: 'Birthday Cheer',
    price: 65.0,
    cost_price: 22.0,
    stock: 20,
    min_stock_alert: 5,
    description: 'Sunflowers with chamomile and eucalyptus',
    images: ['https://images.unsplash.com/photo-1597848212624-a19eb35e2651'],
    flower_types: ['Sunflowers'],
    occasion_tags: ['Birthday'],
    is_featured: 1,
    is_available: 1
  }
];

describe('POS Terminal & Counter Register', () => {
  beforeEach(() => {
    // Mock user in localStorage
    localStorage.setItem('floralk_token', 'test-admin-token');
    localStorage.setItem(
      'floralk_user',
      JSON.stringify({ id: 3, name: 'Liam Rivera', role: 'admin', email: 'admin@floralk.com' })
    );

    // Mock fetch
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url === '/api/auth/me') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                user: { id: 3, name: 'Liam Rivera', role: 'admin', email: 'admin@floralk.com' }
              })
          });
        }
        if (url === '/api/pos/quick-catalog') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ products: mockProducts })
          });
        }
        if (url === '/api/pos/register/status') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                activeSession: {
                  id: 1,
                  session_number: 'REG-2026-001',
                  opened_by_user_id: 3,
                  opened_by_name: 'Liam Rivera',
                  opening_cash: 150.0,
                  status: 'open'
                }
              })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      })
    );
  });

  it('renders POS catalog items and allows adding items to active ticket', async () => {
    const { container } = render(
      <AuthProvider>
        <POSPage />
      </AuthProvider>
    );

    // Verify products load
    await waitFor(() => {
      expect(screen.getByText(/The Scarlet Royale/i)).toBeInTheDocument();
      expect(screen.getByText(/Golden Radiance Sunflower/i)).toBeInTheDocument();
    });

    // Verify register status badge
    expect(screen.getByText(/Active Open/i)).toBeInTheDocument();
    expect(screen.getByText(/Close Register Shift/i)).toBeInTheDocument();

    // Click product to add to ticket
    const productButton = screen.getByText(/The Scarlet Royale/i).closest('button');
    fireEvent.click(productButton!);

    // Check ticket updates
    await waitFor(() => {
      // Subtotal line or product contains ₱129.00
      expect(screen.getAllByText('₱129.00').length).toBeGreaterThanOrEqual(2);
      // Total with 12% EVAT (₱15.48) = ₱144.48
      expect(screen.getByText('₱144.48')).toBeInTheDocument();
    });

    // Test Cash Tender change due calculation
    const tenderInput = container.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(tenderInput, { target: { value: '200' } });

    // Change Due should be 200 - 144.48 = 55.52
    await waitFor(() => {
      expect(screen.getByText('₱55.52')).toBeInTheDocument();
    });
  });
});
