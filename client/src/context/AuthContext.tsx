import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  quickSwitchRole: (targetRole: UserRole) => Promise<void>;
  loading: boolean;
}

const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string }> = {
  super_admin: { email: 'superadmin@floralk.com', pass: 'SuperAdmin123!' },
  owner: { email: 'owner@floralk.com', pass: 'Owner123!' },
  admin: { email: 'admin@floralk.com', pass: 'Admin123!' },
  customer: { email: 'customer@example.com', pass: 'Customer123!' },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('floralk_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('floralk_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // If token exists, verify with /api/auth/me
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          if (!res.ok) throw new Error('Token expired');
          return res.json();
        })
        .then((data) => {
          setUser(data.user);
          localStorage.setItem('floralk_user', JSON.stringify(data.user));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('floralk_token', data.token);
      localStorage.setItem('floralk_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Server connection error' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('floralk_token');
    localStorage.removeItem('floralk_user');
  };

  const quickSwitchRole = async (targetRole: UserRole) => {
    const creds = DEMO_CREDENTIALS[targetRole];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  const role: UserRole = user ? user.role : 'customer';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        login,
        logout,
        quickSwitchRole,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
