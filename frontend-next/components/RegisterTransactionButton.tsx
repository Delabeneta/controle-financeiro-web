// src/components/RegisterTransactionButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

interface RegisterTransactionButtonProps {
  groupId?: string;
  variant?: 'desktop' | 'mobile-fab' | 'always';
}

export function RegisterTransactionButton({
  groupId,
  variant = 'always',
}: RegisterTransactionButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    const path = groupId
      ? `/transacoes/nova?groupId=${groupId}`
      : '/transacoes/nova';
    router.push(path);
  };

  // FAB flutuante para mobile
  if (variant === 'mobile-fab') {
    return (
      <button
        onClick={handleClick}
        aria-label="Nova transação"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#1A2B4C] text-white rounded-full shadow-lg hover:bg-[#2d4a8a] transition-all hover:scale-110 flex items-center justify-center z-50 md:hidden"
      >
        <Plus className="w-6 h-6" />
      </button>
    );
  }

  const visibility = variant === 'always' ? 'flex' : 'hidden md:flex';

  return (
    <button
      onClick={handleClick}
      className={`${visibility} items-center gap-2 px-4 py-2 rounded-lg bg-[#1A2B4C] hover:bg-[#2d4a8a] text-white text-sm font-medium transition-colors`}
    >
      <Plus className="w-4 h-4" />
      Registrar Transação
    </button>
  );
}