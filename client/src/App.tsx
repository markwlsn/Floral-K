import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { CartDrawer } from './components/storefront/CartDrawer';
import { SocialProofToast } from './components/storefront/SocialProofToast';
import { StorefrontPage } from './pages/StorefrontPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { POSPage } from './pages/POSPage';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { AdminInventoryPage } from './pages/AdminInventoryPage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { LoginPage } from './pages/LoginPage';

export function AppContent() {
  const [currentView, setCurrentView] = useState<string>('storefront');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [trackedOrderNumber, setTrackedOrderNumber] = useState<string | null>(null);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string | null>(null);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderSuccess = (orderNumber: string) => {
    setConfirmedOrderNumber(orderNumber);
    setTrackedOrderNumber(orderNumber);
    setCurrentView('storefront');
  };

  const handleNavigateToTrack = (orderNumber: string) => {
    setTrackedOrderNumber(orderNumber);
    setCurrentView('track');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF9] text-stone-900 font-sans">
      {/* 1. Brand Luxury Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onSearch={(term) => setSearchQuery(term)}
      />

      {/* 3. Global Express Checkout Cart Drawer */}
      <CartDrawer onOrderSuccess={handleOrderSuccess} />

      {/* 4. Attention-Grabbing Social Proof Toasts */}
      {currentView === 'storefront' && <SocialProofToast />}

      {/* 5. Active Page Content */}
      <main className="flex-1">
        {currentView === 'storefront' && (
          <StorefrontPage
            onNavigateToTrack={handleNavigateToTrack}
            searchQuery={searchQuery}
            confirmedOrderNumber={confirmedOrderNumber}
            onClearOrderSuccess={() => setConfirmedOrderNumber(null)}
          />
        )}

        {currentView === 'track' && (
          <TrackOrderPage initialOrderNumber={trackedOrderNumber} />
        )}

        {currentView === 'pos' && (
          <POSPage />
        )}

        {currentView === 'orders' && (
          <AdminOrdersPage />
        )}

        {currentView === 'inventory' && (
          <AdminInventoryPage />
        )}

        {currentView === 'owner' && (
          <OwnerDashboardPage />
        )}

        {currentView === 'superadmin' && (
          <SuperAdminPage />
        )}

        {currentView === 'login' && (
          <LoginPage onSuccess={(view) => handleNavigate(view)} />
        )}
      </main>

      {/* 6. Luxury Boutique Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
