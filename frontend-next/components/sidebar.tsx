// src/components/Sidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  LogOut, 
  ChevronLeft,
  Building2,
  UserCircle,
  Menu,
  X,
  Settings,
  CreditCard,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Menu items com ícones e permissões
  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: '/dashboard', 
      roles: ['SUPER_ADMIN', 'ADMIN', 'LIDER'] 
    },
    { 
      icon: Users, 
      label: 'Grupos', 
      path: '/grupos', 
      roles: ['SUPER_ADMIN', 'ADMIN', 'LIDER'] 
    },
    { 
      icon: CreditCard, 
      label: 'Transações', 
      path: '/transacoes', 
      roles: ['SUPER_ADMIN', 'ADMIN', 'LIDER'] 
    },
  ];

  // Usuários - apenas ADMIN e SUPER_ADMIN
  if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
    menuItems.push({ 
      icon: UserCircle, 
      label: 'Usuários', 
      path: '/usuarios', 
      roles: ['ADMIN', 'SUPER_ADMIN'] 
    });
  }

  // Administração - apenas SUPER_ADMIN
  if (user?.role === 'SUPER_ADMIN') {
    menuItems.push({ 
      icon: Building2, 
      label: 'Organizações', 
      path: '/admin', 
      roles: ['SUPER_ADMIN'] 
    });
  }

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path === '/grupos' && pathname.startsWith('/grupos')) return true;
    if (path === '/transacoes' && pathname.startsWith('/transacoes')) return true;
    if (path === '/usuarios' && pathname === '/usuarios') return true;
    if (path === '/admin' && pathname === '/admin') return true;
    return false;
  };

  const sidebarWidth = isMobile ? 'w-64' : (collapsed ? 'w-20' : 'w-64');
  const showText = !collapsed || isMobile;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-primary text-white p-2 rounded-lg shadow-lg hover:bg-primary-dark transition-colors"
        aria-label="Menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`h-screen bg-primary text-white flex flex-col transition-all duration-300 z-50
          ${isMobile 
            ? `fixed inset-y-0 left-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} ${sidebarWidth}`
            : `hidden lg:flex ${sidebarWidth}`
          }`}
      >
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between">
          {showText && (
            <div className="overflow-hidden">
              <h1 className="text-lg md:text-xl font-bold truncate">Gestão Financeira</h1>
              <p className="text-xs text-gray-300 mt-0.5 truncate">Setor Juventude</p>
            </div>
          )}
          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors hidden lg:block flex-shrink-0"
            >
              <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed && 'rotate-180'}`} />
            </button>
          )}
        </div>

        {/* User Info */}
                {user && showText && (
          <div className="p-4 border-b border-white/10">
            <Link
              href="/perfil"
              onClick={() => isMobile && setMobileOpen(false)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm md:text-base">
                {user.nome.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate text-sm md:text-base">{user.nome}</p>
                <p className="text-xs text-gray-300 truncate">
                  {user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'ADMIN' ? 'Admin' : 'Líder'}
                </p>
              </div>
            </Link>
          </div>
        )}

        {/* Collapsed — só inicial */}
        {user && !showText && (
          <Link
            href="/perfil"
            className="p-4 border-b border-white/10 flex justify-center hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-semibold">
              {user.nome.charAt(0).toUpperCase()}
            </div>
          </Link>
        )}
        {/* Navigation */}
        <nav className="flex-1 p-3 md:p-4 space-y-1 md:space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            // Verificar se o usuário tem permissão para ver este item
            if (!item.roles.includes(user?.role || '')) return null;
            
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => isMobile && setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-white/20 text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {showText && <span className="text-sm md:text-base">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 md:p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg w-full text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {showText && <span className="text-sm md:text-base">Sair</span>}
          </button>
        </div>
      </div>
    </>
  );
}