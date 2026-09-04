import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RoleSwitcher } from '../components/common/RoleSwitcher';
import { AuthProvider } from '../context/AuthContext';

describe('RoleSwitcher Component', () => {
  it('renders all 4 system roles for quick testing', () => {
    const onNavigate = vi.fn();
    render(
      <AuthProvider>
        <RoleSwitcher currentView="storefront" onNavigate={onNavigate} />
      </AuthProvider>
    );

    expect(screen.getByText(/Customer Storefront/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin \/ Florist & POS/i)).toBeInTheDocument();
    expect(screen.getByText(/Owner Executive/i)).toBeInTheDocument();
    expect(screen.getByText(/Super Admin Portal/i)).toBeInTheDocument();
  });

  it('navigates to relevant view when switching roles', async () => {
    const onNavigate = vi.fn();

    // Mock fetch for quickSwitchRole login
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url === '/api/auth/login') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                token: 'test-token',
                user: { id: 3, name: 'Liam Rivera', role: 'admin' }
              })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      })
    );

    render(
      <AuthProvider>
        <RoleSwitcher currentView="storefront" onNavigate={onNavigate} />
      </AuthProvider>
    );

    const posBtn = screen.getByText(/Admin \/ Florist & POS/i);
    fireEvent.click(posBtn);

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith('pos');
    });
  });
});
