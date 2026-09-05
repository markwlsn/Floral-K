import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, AuditLog, UserRole } from '../types';
import {
  Shield,
  Users,
  Settings,
  Activity,
  CheckCircle2,
  XCircle,
  Plus,
  Save,
  Lock
} from 'lucide-react';

export const SuperAdminPage: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [storeSettings, setStoreSettings] = useState<Record<string, any>>({});
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // New user form state
  const [showUserModal, setShowUserModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('Password123!');
  const [newRole, setNewRole] = useState<UserRole>('admin');
  const [userError, setUserError] = useState('');

  const loadAdminData = () => {
    if (!token) return;
    setLoading(true);

    Promise.all([
      fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch('/api/settings/audit-logs?limit=25', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json())
    ])
      .then(([u, a, s]) => {
        setUsers(u.users || []);
        setAuditLogs(a.logs || []);
        setStoreSettings(s.settings || {});
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAdminData();
  }, [token]);

  const handleRoleChange = async (userId: number, role: UserRole) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (userId: number, currentActive: number) => {
    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: currentActive === 1 ? 0 : 1 })
      });
      if (res.ok) {
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ settings: storeSettings })
      });
      if (res.ok) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          password: newPassword,
          role: newRole
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setShowUserModal(false);
      setNewName('');
      setNewEmail('');
      loadAdminData();
    } catch (err: any) {
      setUserError(err.message || 'User creation failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] p-8 flex items-center justify-center">
        <div className="text-center text-sm font-medium text-[#86868b]">
          Loading Super Admin Platform Controls...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfd] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-[11px] font-medium">
              <Shield className="w-3.5 h-3.5 text-neutral-600" />
              <span>Platform Super Administration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] mt-1.5">
              Super Admin Control Center
            </h1>
            <p className="text-xs text-[#86868b] mt-0.5">
              Manage system permissions, elevate roles, configure global fees and inspect audit security logs.
            </p>
          </div>

          <button
            onClick={() => setShowUserModal(true)}
            className="px-4 py-2.5 bg-[#1d1d1f] hover:bg-black text-white text-xs font-medium rounded-full shadow-xs flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Provision New Staff User
          </button>
        </div>

        {/* Section 1: User & Role Directory */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#1d1d1f] flex items-center gap-2">
              <Users className="w-4 h-4 text-neutral-600" /> Registered System Users & RBAC Roles
            </h3>
            <span className="text-xs text-[#86868b]">Total Accounts: {users.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f5f5f7]/80 text-[#86868b] uppercase tracking-wider text-[10px] font-semibold border-b border-neutral-200/70">
                <tr>
                  <th className="p-3 font-semibold">User</th>
                  <th className="p-3 font-semibold">Email</th>
                  <th className="p-3 font-semibold">Assigned Role</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Role Control</th>
                  <th className="p-3 font-semibold">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="p-3 font-medium text-[#1d1d1f]">{u.name}</td>
                    <td className="p-3 font-mono text-[#86868b]">{u.email}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                        u.role === 'super_admin'
                          ? 'bg-neutral-900 text-white'
                          : u.role === 'owner'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200/60'
                          : u.role === 'admin'
                          ? 'bg-neutral-200/70 text-neutral-800'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 font-medium text-[11px] ${
                        u.is_active === 1 ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {u.is_active === 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {u.is_active === 1 ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="p-1.5 border border-neutral-200/80 rounded-xl text-xs bg-[#f5f5f7] text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin / Florist</option>
                        <option value="owner">Owner</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.is_active || 1)}
                        className="text-xs font-medium text-[#1d1d1f] hover:underline cursor-pointer"
                      >
                        {u.is_active === 1 ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Global Store Parameters */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#1d1d1f] flex items-center gap-2">
              <Settings className="w-4 h-4 text-neutral-600" /> Global Atelier & Delivery Parameters
            </h3>
            {settingsSaved && (
              <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Settings Saved!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-medium text-[#1d1d1f] block mb-1.5">Tax Rate (e.g. 0.12 for 12% EVAT)</label>
              <input
                type="text"
                value={storeSettings.tax_rate || '0.12'}
                onChange={(e) => setStoreSettings({ ...storeSettings, tax_rate: e.target.value })}
                className="w-full p-2.5 border border-neutral-200/80 rounded-xl bg-[#f5f5f7] font-mono text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="font-medium text-[#1d1d1f] block mb-1.5">Standard Delivery Fee (₱)</label>
              <input
                type="text"
                value={storeSettings.standard_delivery_fee || '150.00'}
                onChange={(e) => setStoreSettings({ ...storeSettings, standard_delivery_fee: e.target.value })}
                className="w-full p-2.5 border border-neutral-200/80 rounded-xl bg-[#f5f5f7] font-mono text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="font-medium text-[#1d1d1f] block mb-1.5">Free Delivery Threshold (₱)</label>
              <input
                type="text"
                value={storeSettings.free_delivery_threshold || '3000.00'}
                onChange={(e) => setStoreSettings({ ...storeSettings, free_delivery_threshold: e.target.value })}
                className="w-full p-2.5 border border-neutral-200/80 rounded-xl bg-[#f5f5f7] font-mono text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-medium text-[#1d1d1f] block mb-1.5">Store Address</label>
              <input
                type="text"
                value={storeSettings.store_address || ''}
                onChange={(e) => setStoreSettings({ ...storeSettings, store_address: e.target.value })}
                className="w-full p-2.5 border border-neutral-200/80 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="font-medium text-[#1d1d1f] block mb-1.5">Direct Boutique Hotline</label>
              <input
                type="text"
                value={storeSettings.store_phone || ''}
                onChange={(e) => setStoreSettings({ ...storeSettings, store_phone: e.target.value })}
                className="w-full p-2.5 border border-neutral-200/80 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="sm:col-span-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#1d1d1f] hover:bg-black text-white rounded-full font-medium text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" /> Save Global Configuration
              </button>
            </div>
          </form>
        </div>

        {/* Section 3: Audit Security Logs */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#1d1d1f] flex items-center gap-2">
              <Activity className="w-4 h-4 text-neutral-600" /> Platform Security & Activity Audit Trail
            </h3>
            <span className="text-xs text-[#86868b]">Live Immutable Log</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-[#f5f5f7] rounded-2xl border border-neutral-200/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
              >
                <div>
                  <span className="font-mono font-medium text-neutral-800 bg-neutral-200/80 px-2 py-0.5 rounded-full text-[10px] mr-2">
                    {log.action}
                  </span>
                  <span className="text-[#1d1d1f]">
                    Entity: <strong>{log.entity}</strong> {log.entity_id ? `(#${log.entity_id})` : ''}
                  </span>
                  {log.details && (
                    <p className="text-[11px] text-[#86868b] font-mono mt-1 truncate max-w-lg">
                      {log.details}
                    </p>
                  )}
                </div>

                <div className="text-right text-[10px] text-[#86868b] shrink-0">
                  <p className="font-medium text-[#1d1d1f]">{log.user_email || 'System / Guest'}</p>
                  <p>{new Date(log.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Provision User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200/80 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80">
              <h4 className="text-base font-semibold text-[#1d1d1f]">Provision New Staff User</h4>
              <button
                onClick={() => setShowUserModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-[#1d1d1f] block mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chloe Vance"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 border border-neutral-200/80 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="font-medium text-[#1d1d1f] block mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. cvance@floralk.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2.5 border border-neutral-200/80 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="font-medium text-[#1d1d1f] block mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 border border-neutral-200/80 rounded-xl bg-[#f5f5f7] font-mono text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="font-medium text-[#1d1d1f] block mb-1.5">Role Assignment</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full p-2.5 border border-neutral-200/80 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="admin">Admin / Florist Staff / POS</option>
                  <option value="owner">Store Owner</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="customer">Customer</option>
                </select>
              </div>

              {userError && (
                <p className="text-xs text-rose-600">{userError}</p>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#1d1d1f] hover:bg-black text-white font-medium text-xs rounded-full transition-all cursor-pointer shadow-xs"
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="py-3 px-5 border border-neutral-200/80 rounded-full text-[#1d1d1f] text-xs font-medium hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
