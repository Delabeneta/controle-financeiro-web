/* eslint-disable @typescript-eslint/no-explicit-any */

// src/components/ResponsiveTable.tsx
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface Column {
  key: string;
  header: string;
  render?: (value: any, item: any) => React.ReactNode;
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  onRowClick?: (item: any) => void;
}

export function ResponsiveTable({ columns, data, onRowClick }: ResponsiveTableProps) {
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
        <p className="text-gray-500">Nenhum dado encontrado</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleCardClick = (item: any) => {
    if (onRowClick) {
      onRowClick(item);
    } else {
      setSelectedItem(item);
    }
  };

  // Função para obter o valor do grupo (para mobile)
  const getGroupValue = (item: any) => {
    const groupColumn = columns.find(c => c.key === 'grupo' || c.key === 'groupName');
    if (!groupColumn) return '-';
    return groupColumn.render ? groupColumn.render(item[groupColumn.key], item) : item[groupColumn.key];
  };

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item, idx) => (
                <tr
                  key={idx}
                  onClick={() => handleCardClick(item)}
                  className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                      {col.render ? col.render(item[col.key], item) : item[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {data.map((item, idx) => {
          const isEntrada = item.type === 'ENTRADA';
          const dataStr = item.data || item.createdAt;
          const groupValue = getGroupValue(item);

          return (
            <div
              key={idx}
              onClick={() => handleCardClick(item)}
              className="bg-white rounded-xl border border-gray-200 flex items-stretch cursor-pointer active:bg-gray-50 transition-colors overflow-hidden"
            >
              {/* Barra lateral colorida */}
              <div className={`w-1 flex-shrink-0 ${isEntrada ? 'bg-emerald-500' : 'bg-red-400'}`} />

              {/* Corpo */}
              <div className="flex-1 px-4 py-3 min-w-0">
                {/* Linha 1: descrição + data */}
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {item.descricao}
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                    {formatDate(dataStr)}
                  </span>
                </div>
                {/* Linha 2: grupo + valor */}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">{groupValue}</span>
                  <span className={`text-sm font-semibold ${isEntrada ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isEntrada ? '+' : '-'} {formatCurrency(item.valor)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pop-up de detalhes (mobile) */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:hidden"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white w-full rounded-t-2xl p-6 pb-8 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do pop-up */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${selectedItem.type === 'ENTRADA' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                <span className="font-semibold text-gray-900 text-base">Detalhes</span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Campos */}
            <div className="space-y-3">
              {columns.map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-4">
                  <span className="text-sm text-gray-500 flex-shrink-0">{col.header}</span>
                  <span className="text-sm text-gray-900 text-right">
                    {col.render ? col.render(selectedItem[col.key], selectedItem) : selectedItem[col.key]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}