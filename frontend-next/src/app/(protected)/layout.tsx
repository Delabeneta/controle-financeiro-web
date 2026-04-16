// src/app/(protected)/layout.tsx
'use client';

import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}