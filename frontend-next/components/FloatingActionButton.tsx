// src/components/FloatingActionButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';

export function FloatingActionButton() {
  const router = useRouter();
  const { user } = useAuth();

  // Verificar se o usuário pode criar transações
  const canCreateTransaction = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'LIDER';

  if (!canCreateTransaction) return null;

  return (
    <button
      onClick={() => router.push('/transacoes/nova')}
     className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-700 transition-all hover:scale-110 flex items-center justify-center z-50"
>
      <Plus className="w-6 h-6" />
    </button>
  );
}