// src/components/EditTransactionModal.tsx
'use client';

import { useState } from 'react';
import { Banknote, CreditCard, Calendar, X } from 'lucide-react';
import { Button } from './ui/button'; 

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    id: string;
    nome: string;
    descricao: string;
    tipo: 'ENTRADA' | 'SAIDA';
    paymentType: string;
    valor: number;
    data: string;
    createdBy: string;
    categoria: string;
    groupName: string;
  };
  onSave: (data: unknown) => void;
}

export function EditTransactionModal({ isOpen, onClose, transaction, onSave }: EditTransactionModalProps) {
  // Formatar a data para YYYY-MM-DD (para o input date)
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    nome: transaction.nome,
    descricao: transaction.descricao,
    valor: transaction.valor,
    categoria: transaction.categoria,
    tipo: transaction.tipo,
    paymentType: transaction.paymentType,
    data: formatDateForInput(transaction.data),
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {

      let dataEnvio;
    if (formData.data) {
      const [year, month, day] = formData.data.split('-');
      dataEnvio = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      dataEnvio.setDate(dataEnvio.getDate() + 1);
    }
      await onSave({
        ...formData,
        data: dataEnvio ? dataEnvio.toISOString() : undefined,
      });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{transaction.nome}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informações fixas (não editáveis) */}
        <div className="p-4 space-y-3 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Registrado por</span>
            <span className="text-sm text-gray-900">{transaction.createdBy}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Grupo</span>
            <span className="text-sm text-gray-900">{transaction.groupName}</span>
          </div>
        </div>

        {/* Formulário editável */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Nome do registro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do registro
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Data - EDITÁVEL (apenas data, sem horário) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          {/* Tipo (ENTRADA/SAÍDA) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: 'ENTRADA' })}
                className={`p-3 border-2 rounded-lg transition-all ${
                  formData.tipo === 'ENTRADA'
                    ? 'border-success bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      formData.tipo === 'ENTRADA'
                        ? 'border-success bg-success'
                        : 'border-gray-300'
                    }`}
                  >
                    {formData.tipo === 'ENTRADA' && (
                      <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />
                    )}
                  </div>
                  <span className="font-medium text-gray-900">Entrada</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: 'SAIDA' })}
                className={`p-3 border-2 rounded-lg transition-all ${
                  formData.tipo === 'SAIDA'
                    ? 'border-danger bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      formData.tipo === 'SAIDA'
                        ? 'border-danger bg-danger'
                        : 'border-gray-300'
                    }`}
                  >
                    {formData.tipo === 'SAIDA' && (
                      <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />
                    )}
                  </div>
                  <span className="font-medium text-gray-900">Saída</span>
                </div>
              </button>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forma de Pagamento *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentType: 'PIX' })}
                className={`p-3 border-2 rounded-lg transition-all ${
                  formData.paymentType === 'PIX'
                    ? 'border-primary bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <CreditCard className={`w-5 h-5 ${
                    formData.paymentType === 'PIX' ? 'text-primary' : 'text-gray-400'
                  }`} />
                  <span className="font-medium text-gray-900">PIX/Banco</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentType: 'DINHEIRO' })}
                className={`p-3 border-2 rounded-lg transition-all ${
                  formData.paymentType === 'DINHEIRO'
                    ? 'border-primary bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Banknote className={`w-5 h-5 ${
                    formData.paymentType === 'DINHEIRO' ? 'text-primary' : 'text-gray-400'
                  }`} />
                  <span className="font-medium text-gray-900">Dinheiro</span>
                </div>
              </button>
            </div>
          </div>

          {/* Valor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Culto">Culto</option>
              <option value="Evento">Evento</option>
              <option value="Doação">Doação</option>
              <option value="Despesa">Despesa</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary-dark"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}