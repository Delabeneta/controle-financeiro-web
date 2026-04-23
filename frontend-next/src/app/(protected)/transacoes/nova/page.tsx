/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/transacoes/nova/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { groupsAPI, transactionsAPI, usersAPI } from '@/src/lib/api';
import { Card } from '@/components/card';
import { Button } from '@/src/components/ui/button';
import { Breadcrumb } from '@/components/BreadCrumb';
import { ArrowLeft, CheckCircle, CreditCard, Banknote, Loader2, TrendingUp, TrendingDown } from 'lucide-react';

export default function NovaTransacaoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    groupId: searchParams.get('groupId') || '',
    tipo: 'ENTRADA' as 'ENTRADA' | 'SAIDA',
    paymentType: 'PIX' as 'PIX' | 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'TRANSFERENCIA',
    valor: '',
    descricao: '',
    data: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadGroups();
  }, [user]);

  const loadGroups = async () => {
    try {
      setLoading(true);

      let editableGroups = [];

      if (user?.role === 'SUPER_ADMIN') {
        const response = await groupsAPI.getAll();
        editableGroups = response.data.map((group: any) => ({
          id: group.id,
          nome: group.nome,
          permission: 'EDITOR',
        }));
      } else if (user?.role === 'ADMIN') {
        const response = await groupsAPI.getAll();
        editableGroups = response.data.map((group: any) => ({
          id: group.id,
          nome: group.nome,
          permission: 'EDITOR',
        }));
      } else if (user?.role === 'LIDER') {
        const response = await usersAPI.getMyGroups();
        const userGroups = response.data.groups || [];
        editableGroups = userGroups.filter((g: any) => g.permission === 'EDITOR');
      }

      setGroups(editableGroups);
    } catch (err) {
      console.error('Erro ao carregar grupos:', err);
      setError('Erro ao carregar grupos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.groupId) newErrors.groupId = 'Selecione um grupo';
    if (!formData.valor) newErrors.valor = 'Informe o valor';
    else if (parseFloat(formData.valor) <= 0) newErrors.valor = 'O valor deve ser positivo';
    if (!formData.descricao.trim()) newErrors.descricao = 'Informe uma descrição';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const dataAtual = new Date();

      let dataParaEnviar;
      if (formData.data) {
        dataParaEnviar = new Date(formData.data);
        dataParaEnviar.setHours(dataAtual.getHours(), dataAtual.getMinutes(), 0, 0);
      } else {
        dataParaEnviar = dataAtual;
      }

      const saoPauloOffset = -3;
      const utc = dataParaEnviar.getTime() + (dataParaEnviar.getTimezoneOffset() * 60000);
      const saoPauloTime = new Date(utc + (3600000 * saoPauloOffset));
      const selectedDate = formData.data ? new Date(formData.data) : new Date();
      selectedDate.setHours(saoPauloTime.getHours(), saoPauloTime.getMinutes(), 0, 0);

      const transactionData = {
        groupId: formData.groupId,
        tipo: formData.tipo,
        valor: parseFloat(formData.valor),
        descricao: formData.descricao,
        data: selectedDate.toISOString(),
        paymentType: formData.paymentType,
      };

      await transactionsAPI.create(transactionData);

      setSuccess(true);

      setTimeout(() => {
        if (formData.groupId) {
          router.push(`/grupos/${formData.groupId}`);
        } else {
          router.push('/transacoes');
        }
      }, 2000);
    } catch (err: any) {
      console.error('Erro ao criar transação:', err);
      setError(err.response?.data?.message || 'Erro ao criar transação');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <Card className="text-center py-12">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Sem Permissão</h3>
          <p className="text-gray-600 mb-4 text-sm md:text-base">
            Você não tem permissão de edição em nenhum grupo.
          </p>
          <Button onClick={() => router.push('/grupos')}>Voltar para Grupos</Button>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">Transação registrada!</h3>
          <p className="text-gray-500 text-sm">Redirecionando...</p>
        </div>
      </div>
    );
  }

  const isEntrada = formData.tipo === 'ENTRADA';

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: 'Transações', path: '/transacoes' },
            { label: 'Nova Transação' },
          ]}
        />
        <div className="flex items-center gap-3 md:gap-4 mt-4">
          <Button variant="ghost" onClick={() => router.back()} className="px-2 md:px-3">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Nova Transação</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Registre uma entrada ou saída</p>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="max-w-lg">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* TIPO */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Tipo de movimentação</p>
              <div className="grid grid-cols-2 gap-3" role="group" aria-label="Tipo de transação">
                <button
                  type="button"
                  aria-pressed={isEntrada}
                  onClick={() => setFormData({ ...formData, tipo: 'ENTRADA' })}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all ${
                    isEntrada
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <TrendingUp className={`w-4 h-4 flex-shrink-0 ${isEntrada ? 'text-green-600' : 'text-gray-400'}`} />
                  Entrada
                </button>
                <button
                  type="button"
                  aria-pressed={!isEntrada}
                  onClick={() => setFormData({ ...formData, tipo: 'SAIDA' })}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all ${
                    !isEntrada
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <TrendingDown className={`w-4 h-4 flex-shrink-0 ${!isEntrada ? 'text-red-500' : 'text-gray-400'}`} />
                  Saída
                </button>
              </div>
            </div>

            {/* MÉTODO DE PAGAMENTO */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Método de pagamento</p>
              <div className="grid grid-cols-2 gap-3" role="group" aria-label="Método de pagamento">
                <button
                  type="button"
                  aria-pressed={formData.paymentType === 'PIX'}
                  onClick={() => setFormData({ ...formData, paymentType: 'PIX' })}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all ${
                    formData.paymentType === 'PIX'
                      ? 'border-primary bg-blue-50 text-primary'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className={`w-4 h-4 flex-shrink-0 ${formData.paymentType === 'PIX' ? 'text-primary' : 'text-gray-400'}`} />
                  PIX / Banco
                </button>
                <button
                  type="button"
                  aria-pressed={formData.paymentType === 'DINHEIRO'}
                  onClick={() => setFormData({ ...formData, paymentType: 'DINHEIRO' })}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all ${
                    formData.paymentType === 'DINHEIRO'
                      ? 'border-primary bg-blue-50 text-primary'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Banknote className={`w-4 h-4 flex-shrink-0 ${formData.paymentType === 'DINHEIRO' ? 'text-primary' : 'text-gray-400'}`} />
                  Dinheiro
                </button>
              </div>
            </div>

            {/* VALOR */}
            <div>
              <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1.5">
                Valor (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none pointer-events-none">
                  R$
                </span>
                <input
                  id="valor"
                  type="number"
                  inputMode="decimal"
                  placeholder="0,00"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => {
                    setFormData({ ...formData, valor: e.target.value });
                    setErrors({ ...errors, valor: '' });
                  }}
                  aria-invalid={!!errors.valor}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary transition ${
                    errors.valor ? 'border-red-400 bg-red-50' : 'border-gray-200'
                  }`}
                />
              </div>
              {errors.valor && (
                <p role="alert" className="text-red-500 text-xs mt-1.5">{errors.valor}</p>
              )}
            </div>

            {/* DESCRIÇÃO */}
            <div>
              <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1.5">
                Descrição
              </label>
              <textarea
                id="descricao"
                placeholder="Descreva o motivo desta transação..."
                rows={3}
                value={formData.descricao}
                onChange={(e) => {
                  setFormData({ ...formData, descricao: e.target.value });
                  setErrors({ ...errors, descricao: '' });
                }}
                aria-invalid={!!errors.descricao}
                className={`w-full px-3.5 py-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary resize-none transition ${
                  errors.descricao ? 'border-red-400 bg-red-50' : 'border-gray-200'
                }`}
              />
              {errors.descricao && (
                <p role="alert" className="text-red-500 text-xs mt-1.5">{errors.descricao}</p>
              )}
            </div>

            {/* DATA */}
            <div>
              <label htmlFor="data" className="block text-sm font-medium text-gray-700 mb-1.5">
                Data
              </label>
              <input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => {
                  setFormData({ ...formData, data: e.target.value });
                  setErrors({ ...errors, data: '' });
                }}
                className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>

            {/* GRUPO */}
            <div>
              <label htmlFor="groupId" className="block text-sm font-medium text-gray-700 mb-1.5">
                Grupo
              </label>
              <select
                id="groupId"
                value={formData.groupId}
                onChange={(e) => {
                  setFormData({ ...formData, groupId: e.target.value });
                  setErrors({ ...errors, groupId: '' });
                }}
                aria-invalid={!!errors.groupId}
                className={`w-full px-3.5 py-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary transition appearance-none bg-white ${
                  errors.groupId ? 'border-red-400 bg-red-50' : 'border-gray-200'
                }`}
              >
                <option value="">Selecione um grupo</option>
                {groups.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.nome}</option>
                ))}
              </select>
              {errors.groupId && (
                <p role="alert" className="text-red-500 text-xs mt-1.5">{errors.groupId}</p>
              )}
            </div>

            {/* AÇÕES */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className={`flex-1 text-white font-medium transition-all ${
                  isEntrada
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registrando...
                  </span>
                ) : (
                  `Registrar ${isEntrada ? 'Entrada' : 'Saída'}`
                )}
              </Button>
            </div>

          </form>
        </Card>
      </div>
    </div>
  );
}