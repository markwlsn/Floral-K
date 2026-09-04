import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ShieldCheck, Crown, Store, ShoppingBag, UserCheck } from 'lucide-react';

interface RoleSwitcherProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentView, onNavigate }) => {
  const { user, role, quickSwitchRole } = useAuth();

  const roles: { key: UserRole; label: string; icon: React.ReactNode; defaultView: string; color: string }[] = [
    { key: 'customer', label: 'Customer Storefront', icon: <ShoppingBag className="w-3.5 h-3.5" />, defaultView: 'storefront', color: 'bg-rose-500 text-white' },
    { key: 'admin', label: 'Admin / Florist & POS', icon: <Store className="w-3.5 h-3.5" />, defaultView: 'pos', color: 'bg-emerald-600 text-white' },
    { key: 'owner', label: 'Owner Executive', icon: <Crown className="w-3.5 h-3.5" />, defaultView: 'owner', color: 'bg-amber-600 text-white' },
    { key: 'super_admin', label: 'Super Admin Portal', icon: <ShieldCheck className="w-3.5 h-3.5" />, defaultView: 'superadmin', color: 'bg-purple-600 text-white' },
  ];

  const handleRoleChange = async (targetRole: UserRole, targetView: string) => {
    await quickSwitchRole(targetRole);
    onNavigate(targetView);
  };

  return (
    <div className="sticky top-2 z-50 px-3 pointer-events-none flex justify-center">
      <div className="pointer-events-auto backdrop-blur-2xl bg-[#1d1d1f]/90 text-white text-xs py-1.5 px-3 rounded-full border border-white/10 shadow-2xl flex flex-wrap items-center justify-between gap-3 max-w-5xl w-full transition-all">
        <div className="flex items-center gap-2 pl-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wider uppercase bg-white/10 text-neutral-300 border border-white/10">
            SYSTEM ROLE SIMULATOR
          </span>
          <span className="hidden sm:inline text-neutral-400 text-[11px]">
            <strong className="text-white font-medium">{user?.name || 'Guest Customer'}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto p-0.5 bg-black/40 rounded-full border border-white/5">
          {roles.map((r) => {
            const isActive = role === r.key;
            return (
              <button
                key={r.key}
                onClick={() => handleRoleChange(r.key, r.defaultView)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#1d1d1f] shadow-sm font-semibold scale-100'
                    : 'text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
                title={`Switch session to ${r.label}`}
              >
                {r.icon}
                <span>{r.label}</span>
                {isActive && <UserCheck className="w-3 h-3 ml-0.5 text-[#1d1d1f]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
