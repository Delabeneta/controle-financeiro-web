// src/components/PermissionDenied.tsx
'use client';

import { Shield } from 'lucide-react';
import { Card } from '@/components/card'; 
import { Button } from '@/src/components/ui/button';
import { useRouter } from 'next/navigation';

export function PermissionDenied() {
  const router = useRouter();

  return (
    <Card className="text-center py-12">
      <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
        Acesso Negado
      </h3>
      <p className="text-gray-600 text-sm md:text-base mb-4">
        Você não tem permissão para acessar esta página.
      </p>
      <Button onClick={() => router.push('/dashboard')}>
        Voltar para o Dashboard
      </Button>
    </Card>
  );
}