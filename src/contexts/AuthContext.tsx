import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  oauthProvider?: string;
}

interface Tenant {
  id: string;
  name: string;
  isConfigured: boolean;
}

interface AuthContextType {
  user: User | null;
  tenants: Tenant[];
  currentTenantId: string | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => void;
  switchTenant: (tenantId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for token in URL (after OAuth callback) or in storage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlTenantId = params.get('tenantId');
    const urlError = params.get('error');

    if (urlToken) {
      localStorage.setItem('token', urlToken);
      if (urlTenantId) {
        localStorage.setItem('tenantId', urlTenantId);
      }
      // Clean URL without triggering page reload
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      setToken(urlToken);
      if (urlTenantId) setCurrentTenantId(urlTenantId);
      fetchUser(urlToken);
    } else if (urlError) {
      console.error('OAuth error:', urlError);
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      setIsLoading(false);
    } else {
      // Check stored token
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        fetchUser(storedToken);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setTenants(data.tenants);
        const tenantId = data.currentTenantId || localStorage.getItem('tenantId');
        setCurrentTenantId(tenantId);
      } else {
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('tenantId', data.tenantId);
    setToken(data.token);
    setUser(data.user);
    setCurrentTenantId(data.tenantId);
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('tenantId', data.tenantId);
    setToken(data.token);
    setUser(data.user);
    setCurrentTenantId(data.tenantId);
  };

  const loginWithGoogle = async () => {
    const res = await fetch('/api/auth/google');
    if (res.ok) {
      const { authUrl } = await res.json();
      window.location.href = authUrl;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');
    setToken(null);
    setUser(null);
    setTenants([]);
    setCurrentTenantId(null);
  };

  const switchTenant = async (tenantId: string) => {
    const res = await fetch('/api/auth/switch-tenant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tenantId }),
    });

    if (res.ok) {
      const { token: newToken } = await res.json();
      localStorage.setItem('token', newToken);
      localStorage.setItem('tenantId', tenantId);
      setToken(newToken);
      setCurrentTenantId(tenantId);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenants,
        currentTenantId,
        token,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        switchTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
