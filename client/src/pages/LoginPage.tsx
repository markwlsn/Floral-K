import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ShieldCheck, Crown, Store, ShoppingBag, LogIn, Sparkles, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onSuccess: (view: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      onSuccess('storefront');
    } else {
      setError(res.error || 'Login failed');
    }
  };

  const handleQuickLogin = async (targetEmail: string, targetPass: string, defaultView: string) => {
    setEmail(targetEmail);
    setPassword(targetPass);
    setError('');
    setLoading(true);

    const res = await login(targetEmail, targetPass);
    setLoading(false);

    if (res.success) {
      onSuccess(defaultView);
    } else {
      setError(res.error || 'Login failed');
    }
  };

  const demoAccounts = [
    { role: 'super_admin' as UserRole, title: 'Super Admin', name: 'Elena Vance', email: 'superadmin@floralk.com', pass: 'SuperAdmin123!', view: 'superadmin', icon: <ShieldCheck className="w-4 h-4 text-purple-600" />, border: 'hover:border-purple-500' },
    { role: 'owner' as UserRole, title: 'Boutique Owner', name: 'Klara Kensington', email: 'owner@floralk.com', pass: 'Owner123!', view: 'owner', icon: <Crown className="w-4 h-4 text-amber-600" />, border: 'hover:border-amber-500' },
    { role: 'admin' as UserRole, title: 'Admin & Lead Florist', name: 'Liam Rivera', email: 'admin@floralk.com', pass: 'Admin123!', view: 'pos', icon: <Store className="w-4 h-4 text-emerald-600" />, border: 'hover:border-emerald-500' },
    { role: 'customer' as UserRole, title: 'Retail Customer', name: 'Sophia Miller', email: 'customer@example.com', pass: 'Customer123!', view: 'storefront', icon: <ShoppingBag className="w-4 h-4 text-rose-500" />, border: 'hover:border-rose-500' },
  ];

  return (
    <div className="min-h-screen bg-[#FCFBF9] py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-stone-200 shadow-xl">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-950 text-amber-300 font-serif font-bold text-xl flex items-center justify-center mx-auto shadow-md">
            FK
          </div>
          <h2 className="font-serif text-2xl font-bold text-emerald-950">
            Sign In to Floral K
          </h2>
          <p className="text-xs text-stone-500">
            Access storefront, POS registers, and executive management.
          </p>
        </div>

        {/* 1-Click Demo Accounts Simulator */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block text-center">
            ⚡ 1-Click Role Login for Quick Testing
          </span>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleQuickLogin(acc.email, acc.pass, acc.view)}
                className={`p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-left transition-all ${acc.border} hover:bg-white shadow-xs cursor-pointer`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {acc.icon}
                  <span className="font-bold text-xs text-stone-900">{acc.title}</span>
                </div>
                <span className="text-[10px] text-stone-500 block truncate">{acc.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-stone-200"></div>
          <span className="flex-shrink mx-3 text-stone-400 text-[10px] uppercase font-semibold">Or enter credentials</span>
          <div className="flex-grow border-t border-stone-200"></div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="font-bold text-stone-700 block mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="name@floralk.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-stone-300 rounded-xl bg-stone-50 focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-stone-300 rounded-xl bg-stone-50 focus:outline-none focus:ring-1 focus:ring-emerald-700 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-950 hover:bg-emerald-900 text-amber-200 font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

      </div>
    </div>
  );
};
