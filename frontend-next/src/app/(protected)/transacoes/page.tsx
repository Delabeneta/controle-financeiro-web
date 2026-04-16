/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/transacoes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { transactionsAPI, usersAPI, groupsAPI } from '@/src/lib/api';
import { Card } from '@/components/card';
import { Breadcrumb } from '@/components/BreadCrumb';
import { ArrowUpCircle, ArrowDownCircle, Loader2 } from 'lucide-react';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { EditTransactionModal } from '@/components/EditTransactionModal';
import { SaldoCards } from '@/components/Saldocards'; 
import { TransactionFilters } from '@/components/Transactionfilters';
import { RegisterTransactionButton } from '@/components/RegisterTransactionButton';

export default function TransacoesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [canCreateTransaction, setCanCreateTransaction] = useState(false);
  const [canEditTransaction, setCanEditTransaction] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'ENTRADA' | 'SAIDA'>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'PIX' | 'DINHEIRO' | 'CARTAO' | 'TRANSFERENCIA'>('all');

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      let groupsData = [];

      if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
        const response = await groupsAPI.getAll();
        groupsData = response.data || [];
        setCanCreateTransaction(true);
        setCanEditTransaction(true);
      } else {
        const response = await usersAPI.getMyGroups();
        groupsData = response.data.groups || [];
        const hasEditPermission = groupsData.some((g: any) => g.permission === 'EDITOR');
        setCanCreateTransaction(hasEditPermission);
        setCanEditTransaction(false);
      }

      setGroups(groupsData);

      const transactionsRes = await transactionsAPI.getAll();

      let transactionsData = [];
      if (Array.isArray(transactionsRes.data)) {
        transactionsData = transactionsRes.data;
      } else if (transactionsRes.data.transactions) {
        transactionsData = transactionsRes.data.transactions;
      }

      setTransactions(
        transactionsData.map((t: any) => ({
          ...t,
          valor: typeof t.valor === 'number' ? t.valor : Number(t.valor),
        }))
      );
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTransaction = async (data: any) => {
    if (!selectedTransaction) return;
    try {
      await transactionsAPI.update(selectedTransaction.id, {
        descricao: data.descricao,
        valor: data.valor,
        paymentType: data.paymentType,
        tipo: data.tipo,
      });
      await loadData();
      setIsEditModalOpen(false);
      setSelectedTransaction(null);
    } catch (error) {
      console.error('Erro ao editar transação:', error);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterGroup !== 'all' && t.groupId !== filterGroup) return false;
    if (filterPayment !== 'all') {
      if (filterPayment === 'CARTAO') {
        if (t.paymentType !== 'CARTAO_CREDITO' && t.paymentType !== 'CARTAO_DEBITO') return false;
      } else if (t.paymentType !== filterPayment) return false;
    }
    return true;
  });

  const saldoPix = filteredTransactions.reduce((sum, t) => {
    if (t.paymentType !== 'PIX') return sum;
    return sum + (t.type === 'ENTRADA' ? t.valor : -t.valor);
  }, 0);

  const saldoDinheiro = filteredTransactions.reduce((sum, t) => {
    if (t.paymentType !== 'DINHEIRO') return sum;
    return sum + (t.type === 'ENTRADA' ? t.valor : -t.valor);
  }, 0);

  const saldoTotal = saldoPix + saldoDinheiro;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getGroupName = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    return group?.nome || groupId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Breadcrumb items={[{ label: 'Transações' }]} />
            <div className="mt-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Transações</h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Histórico completo de movimentações
              </p>
            </div>
          </div>

          {canCreateTransaction && <RegisterTransactionButton />}
        </div>
      </div>

      {/* Saldo Cards */}
      <SaldoCards
        saldos={{ saldoTotal, saldoPix, saldoDinheiro }}
        labelBanco="Saldo PIX"
        labelCaixa="Saldo Dinheiro"
      />

      {/* Filtros */}
      <Card className="mb-6">
        <TransactionFilters
          filterType={filterType}
          onFilterTypeChange={setFilterType}
          filterPayment={filterPayment}
          onFilterPaymentChange={setFilterPayment}
          filterGroup={filterGroup}
          onFilterGroupChange={setFilterGroup}
          groups={groups}
          totalCount={filteredTransactions.length}
        />
      </Card>

      {/* Tabela */}
      <ResponsiveTable
        columns={[
          {
            key: 'data',
            header: 'Data',
            render: (value, item) => formatDate(item.data || item.createdAt),
          },
          {
            key: 'grupo',
            header: 'Grupo',
            render: (value, item) => getGroupName(item.groupId),
          },
          { key: 'descricao', header: 'Descrição' },
          {
            key: 'type',
            header: 'Tipo',
            render: (value, item) => (
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  item.type === 'ENTRADA' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {item.type === 'ENTRADA' ? (
                  <ArrowUpCircle className="w-3 h-3" />
                ) : (
                  <ArrowDownCircle className="w-3 h-3" />
                )}
                {item.type === 'ENTRADA' ? 'Entrada' : 'Saída'}
              </span>
            ),
          },
          {
            key: 'paymentType',
            header: 'Pagamento',
            render: (value, item) => {
              const map: Record<string, string> = {
                PIX: 'PIX',
                DINHEIRO: 'Dinheiro',
                CARTAO_CREDITO: 'Cartão Crédito',
                CARTAO_DEBITO: 'Cartão Débito',
                TRANSFERENCIA: 'Transferência',
              };
              return map[item.paymentType] ?? '-';
            },
          },
          {
            key: 'valor',
            header: 'Valor',
            render: (value, item) => (
              <span className={`font-semibold ${item.type === 'ENTRADA' ? 'text-success' : 'text-danger'}`}>
                {item.type === 'ENTRADA' ? '+' : '-'} {formatCurrency(item.valor)}
              </span>
            ),
          },
          {
            key: 'user',
            header: 'Criado por',
            render: (value, item) => item.user?.nome || 'Sistema',
          },
        ]}
        data={filteredTransactions}
        onEdit={(t) => {
          setSelectedTransaction(t);
          setIsEditModalOpen(true);
        }}
        canEdit={canEditTransaction}
      />
      
      {/* Modal de Edição */}
      {selectedTransaction && (
        <EditTransactionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTransaction(null);
          }}
          transaction={{
            id: selectedTransaction.id,
            nome: selectedTransaction.descricao,
            descricao: selectedTransaction.descricao,
            tipo: selectedTransaction.type,
            paymentType: selectedTransaction.paymentType || 'PIX',
            valor: selectedTransaction.valor,
            data: selectedTransaction.data || selectedTransaction.createdAt,
            createdBy: selectedTransaction.user?.nome || 'Sistema',
            categoria: 'Outro',
            groupName: getGroupName(selectedTransaction.groupId),
          }}
          onSave={handleEditTransaction}
        />
      )}
    </div>
  );
}