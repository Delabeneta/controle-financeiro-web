'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { api, authAPI, User } from '@/src/lib/api';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const safeStorage = {
  get: (key: string): string | null => {
    try {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string): void => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(key, value);
    } catch {
      console.warn('localStorage não disponível');
    }
  },
  remove: (key: string): void => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(key);
    } catch {}
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
   const initAuth = async () => {
    const token = safeStorage.get('access_token');
    const savedUser = safeStorage.get('user');

    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);

      } catch {
        safeStorage.remove('access_token');
        safeStorage.remove('user');
      }
    }

    setMounted(true); 
  };
  
  initAuth();
}, []);

  useEffect(() => {
    if (!mounted) return;

    if (!user && pathname !== '/login') {
      router.replace('/login');
    }
    if (user && pathname === '/login') {
      router.replace('/dashboard');
    }
  }, [mounted, user, pathname, router]);

  // Todas as funções ANTES do return condicional
  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { access_token, user: userData } = response.data;

      safeStorage.set('access_token', access_token);
      safeStorage.set('user', JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      setUser(userData);
      router.replace('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('E-mail ou senha incorretos');
    }
  };

  const logout = useCallback(() => {
    safeStorage.remove('access_token');
    safeStorage.remove('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    router.push('/login');
  }, [router]);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      safeStorage.set('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  if (!mounted) return (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '100vh' 
  }}>
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user }}>
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