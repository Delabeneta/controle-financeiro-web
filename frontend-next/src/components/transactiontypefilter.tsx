// src/components/TransactionTypeFilter.tsx
'use client';

type FilterType = 'all' | 'ENTRADA' | 'SAIDA';

interface TransactionTypeFilterProps {
  value: FilterType;
  onChange: (value: FilterType) => void;
}

const OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'ENTRADA', label: 'Entradas' },
  { key: 'SAIDA', label: 'Saídas' },
];

const activeClass: Record<FilterType, string> = {
  all: 'bg-gray-100 text-gray-800 font-medium',
  ENTRADA: 'bg-emerald-100 text-emerald-800 font-medium',
  SAIDA: 'bg-red-100 text-red-800 font-medium',
};

export function TransactionTypeFilter({ value, onChange }: TransactionTypeFilterProps) {
  return (
    <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden text-sm shrink-0">
      {OPTIONS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-3 py-1.5 transition-colors whitespace-nowrap ${
            value === key ? activeClass[key] : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}