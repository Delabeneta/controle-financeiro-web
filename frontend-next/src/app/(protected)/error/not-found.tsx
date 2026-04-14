// src/app/not-found.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { Building2 } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Building2 className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-xl md:text-2xl font-semibold text-gray-700 mb-4">Página não encontrada</h2>
        <p className="text-gray-600 mb-8 max-w-md">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link href="/dashboard">
          <Button className="bg-primary hover:bg-primary-dark">
            Voltar para o Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}