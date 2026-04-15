// src/components/RegisterTransactionButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/src/components/ui/button';

interface RegisterTransactionButtonProps {
  groupId?: string;
}

export function RegisterTransactionButton({ groupId }: RegisterTransactionButtonProps) {
  const router = useRouter();
  
  const handleClick = () => {
    if (groupId) {
      router.push(`/transacoes/nova?groupId=${groupId}`);
    } else {
      router.push('/transacoes/nova');
    }
  };

  return (
    <Button
      onClick={handleClick}
      className="bg-green-500 hover:bg-green-700 text-white"
    >
      <Plus className="w-4 h-4 mr-2" />
      Registrar Transação
    </Button>
  );
}