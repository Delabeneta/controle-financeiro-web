// src/components/EditGroupModal.tsx
'use client';

import { useState } from 'react';
import { X} from 'lucide-react';
import { Button } from '@/src/components/ui/button';

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: {
    id: string;
    nome: string;
    liderNome: string;
    saldoDinheiro: number;
    saldoBanco: number;
    totalTransacoes: number;
  };
  onSave: (data: unknown) => void;
}

export function EditGroupModal({ isOpen, onClose, group, onSave }: EditGroupModalProps) {
  const [formData, setFormData] = useState({
    nome: group.nome,
    liderNome: group.liderNome,
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Editar Grupo</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Líder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Líder
            </label>
            <input
              type="text"
              value={formData.liderNome}
              onChange={(e) => setFormData({ ...formData, liderNome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Nome do líder"
            />
          </div>

          {/* Total de transações (apenas leitura) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total de transações
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-700">
              {group.totalTransacoes} {group.totalTransacoes === 1 ? 'registro' : 'registros'}
            </div>
          </div>

                 {/* Em dinheiro (apenas leitura) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Em dinheiro
            </label>
            <div className="px-3 py-2 bg-green-50 rounded-lg text-green-700 font-semibold">
              {formatCurrency(group.saldoDinheiro)}
            </div>
          </div>

          {/* Em banco/PIX (apenas leitura) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Em banco/PIX
            </label>
            <div className="px-3 py-2 bg-blue-50 rounded-lg text-blue-700 font-semibold">
              {formatCurrency(group.saldoBanco)}
            </div>
          </div>

          {/* Saldo total (apenas leitura) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Saldo total
            </label>
            <div className="px-3 py-2 bg-purple-50 rounded-lg text-purple-700 font-bold text-lg">
              {formatCurrency(group.saldoDinheiro + group.saldoBanco)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="flex-1 bg-primary hover:bg-primary-dark"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}