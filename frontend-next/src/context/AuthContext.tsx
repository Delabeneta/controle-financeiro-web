// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { api, authAPI, User } from '@/src/lib/api';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname(); // ← Mover para fora do restoreSession
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função para restaurar sessão
  const restoreSession = useCallback((): User | null => {
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');
    
    console.log('🔍 Token encontrado:', token ? 'Sim' : 'Não');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('✅ Token configurado no axios');
        return userData;
      } catch (error) {
        console.error('❌ Erro ao restaurar sessão:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
      }
    }
    
    return null;
  }, []);

  // Executar restauração apenas uma vez
  useEffect(() => {
    const restoredUser = restoreSession();
    setUser(restoredUser);
    setIsLoading(false);
    
    // 🔥 Redirecionar se não tiver token e não estiver na página de login
    if (!restoredUser && pathname !== '/login') {
      console.log('🚫 Sem autenticação, redirecionando para login');
      router.replace('/login');
    }
  }, [restoreSession, pathname, router]);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Tentando login com:', email);
      const response = await authAPI.login(email, password);
      console.log('✅ Resposta do login:', response.data);
      
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setUser(userData);
      console.log('🎉 Login realizado com sucesso');
      
      // Redirecionar para dashboard após login
      router.push('/dashboard');
    } catch (error) {
      console.error('❌ Login error:', error);
      throw new Error('E-mail ou senha incorretos');
    }
  };

  const logout = useCallback(() => {
    console.log('🚪 Fazendo logout...');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    router.push('/login');
  }, [router]);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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