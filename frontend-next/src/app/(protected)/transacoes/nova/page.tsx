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
import { ArrowLeft, CheckCircle, CreditCard, Banknote, Loader2 } from 'lucide-react';

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
      const response = await groupsAPI.getAll(); // Busca TODOS os grupos
      editableGroups = response.data.map((group: any) => ({
        id: group.id,
        nome: group.nome,
        permission: 'EDITOR',
      }));
    } 
    // 🔹 ADMIN: pode criar transações em todos os grupos da SUA organização
    else if (user?.role === 'ADMIN') {
      const response = await groupsAPI.getAll(); // GET /groups (já filtra por organização no backend)
      editableGroups = response.data.map((group: any) => ({
        id: group.id,
        nome: group.nome,
        permission: 'EDITOR',
      }));
    } 
    else if (user?.role === 'LIDER') {
      const response = await usersAPI.getMyGroups();
      const userGroups = response.data.groups || [];
      editableGroups = userGroups.filter((g: any) => g.permission === 'EDITOR');
    }
    
    console.log('Grupos editáveis:', editableGroups);
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
    
    if (!formData.groupId) {
      newErrors.groupId = 'Selecione um grupo';
    }
    
    if (!formData.valor) {
      newErrors.valor = 'Informe o valor';
    } else if (parseFloat(formData.valor) <= 0) {
      newErrors.valor = 'O valor deve ser positivo';
    }
    
    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Informe uma descrição';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
         const dataAtual = new Date();
    
        // Se o usuário selecionou uma data específica, usa ela
        let dataParaEnviar;
        if (formData.data) {
          // Usa a data selecionada pelo usuário
          dataParaEnviar = new Date(formData.data);
          // Mantém o horário atual
          dataParaEnviar.setHours(dataAtual.getHours(), dataAtual.getMinutes(), 0, 0);
        } else {
          // Usa a data atual
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
      
      console.log('Data enviada:', transactionData.data);

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
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
            Sem Permissão
          </h3>
          <p className="text-gray-600 mb-4 text-sm md:text-base">
            Você não tem permissão de edição em nenhum grupo.
          </p>
          <Button onClick={() => router.push('/grupos')}>
            Voltar para Grupos
          </Button>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-4 md:p-8">
        <Card className="text-center py-12">
          <CheckCircle className="w-12 h-12 md:w-16 md:h-16 text-success mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
            Transação Registrada com Sucesso!
          </h3>
          <p className="text-gray-600 text-sm md:text-base">
            Redirecionando...
          </p>
        </Card>
      </div>
    );
  }

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
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="px-2 md:px-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Nova Transação</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Registre uma entrada ou saída</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="max-w-2xl">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grupo *
              </label>
              <select
                value={formData.groupId}
                onChange={(e) => {
                  setFormData({ ...formData, groupId: e.target.value });
                  setErrors({ ...errors, groupId: '' });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione um grupo</option>
                {groups.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.nome}</option>
                ))}
              </select>
              {errors.groupId && <p className="text-red-500 text-sm mt-1">{errors.groupId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo *
              </label>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: 'ENTRADA' })}
                  className={`p-3 md:p-4 border-2 rounded-lg transition-all ${
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
                    <span className="font-medium text-gray-900 text-sm md:text-base">Entrada</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: 'SAIDA' })}
                  className={`p-3 md:p-4 border-2 rounded-lg transition-all ${
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
                    <span className="font-medium text-gray-900 text-sm md:text-base">Saída</span>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Método de Pagamento *
              </label>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentType: 'PIX' })}
                  className={`p-3 md:p-4 border-2 rounded-lg transition-all ${
                    formData.paymentType === 'PIX'
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <CreditCard className={`w-5 h-5 ${
                      formData.paymentType === 'PIX' ? 'text-primary' : 'text-gray-400'
                    }`} />
                    <span className="font-medium text-gray-900 text-sm md:text-base">PIX/Banco</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentType: 'DINHEIRO' })}
                  className={`p-3 md:p-4 border-2 rounded-lg transition-all ${
                    formData.paymentType === 'DINHEIRO'
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Banknote className={`w-5 h-5 ${
                      formData.paymentType === 'DINHEIRO' ? 'text-primary' : 'text-gray-400'
                    }`} />
                    <span className="font-medium text-gray-900 text-sm md:text-base">Dinheiro</span>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data *
              </label>
              <input
                type="date"
                value={formData.data}
                onChange={(e) => {
                  setFormData({ ...formData, data: e.target.value });
                  setErrors({ ...errors, data: '' });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.data && <p className="text-red-500 text-sm mt-1">{errors.data}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor (R$) *
              </label>
              <input
                type="number"
                placeholder="0,00"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => {
                  setFormData({ ...formData, valor: e.target.value });
                  setErrors({ ...errors, valor: '' });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.valor && <p className="text-red-500 text-sm mt-1">{errors.valor}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição *
              </label>
              <textarea
                placeholder="Descreva o motivo desta transação..."
                rows={4}
                value={formData.descricao}
                onChange={(e) => {
                  setFormData({ ...formData, descricao: e.target.value });
                  setErrors({ ...errors, descricao: '' });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              {errors.descricao && <p className="text-red-500 text-sm mt-1">{errors.descricao}</p>}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 order-2 sm:order-1"
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className={`flex-1 order-1 sm:order-2 ${
                  formData.tipo === 'ENTRADA'
                    ? 'bg-success hover:bg-green-700'
                    : 'bg-danger hover:bg-red-600'
                }`}
                disabled={submitting}
              >
                {submitting ? 'Registrando...' : 'Registrar Transação'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}