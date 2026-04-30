// src/components/TransactionCard.tsx
'use client';

import { Calendar, User, CreditCard, Tag, Edit2 } from 'lucide-react';

interface TransactionCardProps {
  transaction: {
    id: string;
    nome: string;
    tipo: 'ENTRADA' | 'SAIDA';
    paymentType: string;
    valor: number;
    data: string;
    createdBy: string;
    categoria: string;
    groupName: string;
  };
  onEdit: () => void;
}

export function TransactionCard({ transaction, onEdit }: TransactionCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header com tipo e data */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          transaction.tipo === 'ENTRADA' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {transaction.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}
        </span>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          {formatDate(transaction.data)}
        </div>
      </div>

      {/* Nome e Valor */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900">{transaction.nome}</h3>
        <span className={`font-semibold ${transaction.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
          {transaction.tipo === 'ENTRADA' ? '+' : '-'} {formatCurrency(transaction.valor)}
        </span>
      </div>

      {/* Categoria (pequeno) */}
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
        <Tag className="w-3 h-3" />
        {transaction.categoria}
      </div>

      {/* Footer com informações adicionais */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {transaction.createdBy}
          </div>
          <div className="flex items-center gap-1">
            <CreditCard className="w-3 h-3" />
            {transaction.paymentType}
          </div>
        </div>
        <button
          onClick={onEdit}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Edit2 className="w-4 h-4 text-gray-400 hover:text-primary" />
        </button>
      </div>
    </div>
  );
}