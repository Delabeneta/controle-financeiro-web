// src/components/TransactionFilters.tsx
'use client';

import { TransactionTypeFilter } from "./transactiontypefilter";

type FilterType = 'all' | 'ENTRADA' | 'SAIDA';
type PaymentType = 'all' | 'PIX' | 'DINHEIRO' | 'CARTAO' | 'TRANSFERENCIA';

interface Group {
  id: string;
  nome: string;
}

interface TransactionFiltersProps {
  filterType: FilterType;
  onFilterTypeChange: (value: FilterType) => void;

  filterPayment: PaymentType;
  onFilterPaymentChange: (value: PaymentType) => void;

  filterGroup: string;
  onFilterGroupChange: (value: string) => void;

  groups: Group[];
  totalCount: number;
}

export function TransactionFilters({
  filterType,
  onFilterTypeChange,
  filterPayment,
  onFilterPaymentChange,
  filterGroup,
  onFilterGroupChange,
  groups,
  totalCount,
}: TransactionFiltersProps) {
  const selectClass =
    'text-sm px-2 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A2B4C] min-w-0';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Tipo — pill buttons */}
      <TransactionTypeFilter value={filterType} onChange={onFilterTypeChange} />

      {/* Pagamento */}
      <select
        value={filterPayment}
        onChange={(e) => onFilterPaymentChange(e.target.value as PaymentType)}
        className={selectClass}
      >
        <option value="all">Pagamento</option>
        <option value="PIX">PIX</option>
        <option value="DINHEIRO">Dinheiro</option>
        <option value="CARTAO">Cartão</option>
        <option value="TRANSFERENCIA">Transferência</option>
      </select>

      {/* Grupo */}
      {groups.length > 0 && (
        <select
          value={filterGroup}
          onChange={(e) => onFilterGroupChange(e.target.value)}
          className={selectClass}
        >
          <option value="all">Todos os grupos</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nome}
            </option>
          ))}
        </select>
      )}

      {/* Contador */}
      <span className="ml-auto text-sm text-gray-400 whitespace-nowrap">
        {totalCount} {totalCount === 1 ? 'transação' : 'transações'}
      </span>
    </div>
  );
}