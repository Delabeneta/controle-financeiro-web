

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { api, authAPI, User, wakeUpServer, validateToken } from '@/src/lib/api';
import { ServerWakingScreen } from '../components/ServerWakingScreen';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
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
  const [serverWaking, setServerWaking] = useState(false);
  const [serverFailed, setServerFailed] = useState(false);
  const abortRef = React.useRef(false);

  useEffect(() => {
  let cancelled = false;

  const clearSession = () => {
    safeStorage.remove('access_token');
    safeStorage.remove('user');
    delete api.defaults.headers.common['Authorization'];
  };

  const initAuth = async () => {
    const token = safeStorage.get('access_token');
    const savedUser = safeStorage.get('user');

    // Sem sessão: mostra o login já e acorda o servidor em segundo plano
    if (!token || !savedUser) {
      setMounted(true);
      void wakeUpServer();
      return;
    }

    let userData: User;
    try {
      userData = JSON.parse(savedUser);
    } catch {
      clearSession();
      setMounted(true);
      return;
    }

    // Com sessão: segura a tela até o servidor responder e o token ser validado
    setServerWaking(true);

    const online = await wakeUpServer(() => cancelled || abortRef.current);
    if (cancelled || abortRef.current) return;
    if (!online) {
      setServerFailed(true);
      return;
    }

    const status = await validateToken(token);
    if (cancelled || abortRef.current) return;

    if (status === 'invalid') {
      clearSession(); // sem user -> o efeito de redirect manda para /login
    } else {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
    }

    setServerWaking(false);
    setMounted(true);
  };

  initAuth();
  return () => {
    cancelled = true;
  };
}, []);

const handleBackToLogin = () => {
  abortRef.current = true;
  safeStorage.remove('access_token');
  safeStorage.remove('user');
  delete api.defaults.headers.common['Authorization'];
  setServerWaking(false);
  setServerFailed(false);
  setUser(null);
  setMounted(true);
};
  const hasRedirected = React.useRef(false);
  useEffect(() => {
    if (!mounted || hasRedirected.current) return;

    if (!user && pathname !== '/login') {
      hasRedirected.current = true;
      router.replace('/login');
    }
    if (user && pathname === '/login') {
      hasRedirected.current = true;
      router.replace('/dashboard');
    }
  }, [mounted, user, pathname, router]);


  

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
  const semResposta = !(error as { response?: unknown })?.response;
  throw new Error(
    semResposta
      ? 'Não foi possível conectar ao servidor. Tente novamente em instantes.'
      : 'E-mail ou senha incorretos',
  );
} };

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

    if (!mounted) {
  return (
    <ServerWakingScreen
      waking={serverWaking}
      failed={serverFailed}
      onRetry={() => window.location.reload()}
      onBackToLogin={handleBackToLogin}
    />
  );
}

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user,
      isLoading: !mounted,
    }}>
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