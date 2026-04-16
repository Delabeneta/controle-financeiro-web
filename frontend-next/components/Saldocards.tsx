// src/components/SaldoCards.tsx
'use client';

import { CreditCard, Banknote, Wallet } from 'lucide-react';
import { Card } from '@/components/card';

interface SaldoData {
  saldoTotal: number;
  /** Saldo via PIX / banco */
  saldoBanco?: number;
  /** Saldo em dinheiro / caixa */
  saldoCaixa?: number;
  /** Alias alternativo para saldoBanco (vindo de TransacoesPage) */
  saldoPix?: number;
  /** Alias alternativo para saldoCaixa (vindo de TransacoesPage) */
  saldoDinheiro?: number;
}

interface SaldoCardsProps {
  saldos: SaldoData;
  /** Label do segundo card. Default: "Saldo em Banco" */
  labelBanco?: string;
  /** Label do terceiro card. Default: "Saldo em Caixa" */
  labelCaixa?: string;
}

export function SaldoCards({
  saldos,
  labelBanco = 'Saldo em Banco',
  labelCaixa = 'Saldo em Caixa',
}: SaldoCardsProps) {
  const banco = saldos.saldoBanco ?? saldos.saldoPix ?? 0;
  const caixa = saldos.saldoCaixa ?? saldos.saldoDinheiro ?? 0;
  const total = saldos.saldoTotal;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {/* Saldo Total — destaque com gradiente */}
      <Card className="bg-gradient-to-br from-[#1A2B4C] to-[#2d4a8a] text-white border-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm mb-1">Saldo Total</p>
            <p className="text-2xl font-bold">{formatCurrency(total)}</p>
          </div>
          <div className="p-3 bg-white/10 rounded-lg">
            <Wallet className="w-5 h-5 text-white" />
          </div>
        </div>
      </Card>

      {/* Saldo Banco / PIX */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{labelBanco}</p>
            <p className={`text-xl font-bold ${banco >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {formatCurrency(banco)}
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <CreditCard className="w-5 h-5 text-[#1A2B4C]" />
          </div>
        </div>
      </Card>

      {/* Saldo Caixa / Dinheiro */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{labelCaixa}</p>
            <p className={`text-xl font-bold ${caixa >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {formatCurrency(caixa)}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg">
            <Banknote className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </Card>
    </div>
  );
}