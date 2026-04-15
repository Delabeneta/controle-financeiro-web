/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/transacoes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { transactionsAPI, usersAPI, groupsAPI } from '@/src/lib/api';
import { Card } from '@/components/card';
import { Button } from '@/src/components/ui/button';
import { Breadcrumb } from '@/components/BreadCrumb';
import { 
  ArrowUpCircle, 
  ArrowDownCircle,
  CreditCard,
  Banknote,
  Wallet,
  Loader2,
  Plus,
} from 'lucide-react';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { EditTransactionModal } from '@/components/EditTransactionModal';

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
  
  // Estado para o modal de edição
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
        setCanEditTransaction(true); // ✅ Admin e Super Admin podem editar
      } else {
        const response = await usersAPI.getMyGroups();
        groupsData = response.data.groups || [];
        const hasEditPermission = groupsData.some((g: any) => g.permission === 'EDITOR');
        setCanCreateTransaction(hasEditPermission);
        setCanEditTransaction(false); // ✅ Líder NÃO pode editar
      }
      
      setGroups(groupsData);
      
      const transactionsRes = await transactionsAPI.getAll();
      
      let transactionsData = [];
      if (Array.isArray(transactionsRes.data)) {
        transactionsData = transactionsRes.data;
      } else if (transactionsRes.data.transactions) {
        transactionsData = transactionsRes.data.transactions;
      } else {
        transactionsData = [];
      }
      
      const formattedTransactions = transactionsData.map((t: any) => ({
        ...t,
        valor: typeof t.valor === 'number' ? t.valor : Number(t.valor),
      }));
      
      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para editar transação
  const handleEditTransaction = async (data: any) => {
    if (!selectedTransaction) return;

     console.log('📝 Editando transação:', {
    id: selectedTransaction.id,
    dados: {
      descricao: data.descricao,
      valor: data.valor,
      tipo: data.tipo,
      paymentType: data.paymentType,
    }
  });

    try {
      const response = await transactionsAPI.update(selectedTransaction.id, {
        descricao: data.descricao,
        valor: data.valor,
        paymentType: data.paymentType,
        tipo: data.tipo,
      });
      
      console.log('Resposta do back: ', response.data);
      await loadData();
      setIsEditModalOpen(false);
      setSelectedTransaction(null);
    } catch (error) {
      console.error('Erro ao editar transação:', error);
    }
  };

  const handleOpenEditModal = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const filteredTransactions = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterGroup !== 'all' && t.groupId !== filterGroup) return false;
    if (filterPayment !== 'all') {
      if (filterPayment === 'CARTAO') {
        if (t.paymentType !== 'CARTAO_CREDITO' && t.paymentType !== 'CARTAO_DEBITO') return false;
      } else if (t.paymentType !== filterPayment) return false;
    }
    return true;
  });

  const calculateSaldoPix = () => {
    return filteredTransactions.reduce((sum, t) => {
      if (t.paymentType !== 'PIX') return sum;
      return sum + (t.type === 'ENTRADA' ? t.valor : -t.valor);
    }, 0);
  };

  const calculateSaldoDinheiro = () => {
    return filteredTransactions.reduce((sum, t) => {
      if (t.paymentType !== 'DINHEIRO') return sum;
      return sum + (t.type === 'ENTRADA' ? t.valor : -t.valor);
    }, 0);
  };

  const saldoPix = calculateSaldoPix();
  const saldoDinheiro = calculateSaldoDinheiro();
  const saldoTotal = saldoPix + saldoDinheiro;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

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
    const group = groups.find(g => g.id === groupId);
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
          
          {canCreateTransaction && (
            <Button
              onClick={() => router.push('/transacoes/nova')}
              variant="default"
              className="bg-success hover:bg-green-700 hidden md:flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Transação
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Saldo PIX</p>
              <p className={`text-xl font-bold ${saldoPix >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(saldoPix)}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Saldo Dinheiro</p>
              <p className={`text-xl font-bold ${saldoDinheiro >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(saldoDinheiro)}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Banknote className="w-5 h-5 text-success" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Saldo Total</p>
              <p className={`text-xl font-bold ${saldoTotal >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(saldoTotal)}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <Wallet className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tipo */}
          <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden text-sm">
            {(['all', 'ENTRADA', 'SAIDA'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 transition-colors ${
                  filterType === type
                    ? type === 'ENTRADA'
                      ? 'bg-green-100 text-green-800 font-medium'
                      : type === 'SAIDA'
                      ? 'bg-red-100 text-red-800 font-medium'
                      : 'bg-gray-100 text-gray-800 font-medium'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {type === 'all' ? 'Todos' : type === 'ENTRADA' ? 'Entradas' : 'Saídas'}
              </button>
            ))}
          </div>

          {/* Pagamento */}
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value as any)}
            className="text-sm px-2 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Pagamento</option>
            <option value="PIX">PIX</option>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="CARTAO">Cartão</option>
            <option value="TRANSFERENCIA">Transferência</option>
          </select>

          {/* Grupo */}
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="text-sm px-2 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos os grupos</option>
            {groups.map((g: any) => (
              <option key={g.id} value={g.id}>{g.nome}</option>
            ))}
          </select>

          {/* Contador */}
          <span className="ml-auto text-sm text-gray-500">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transação' : 'transações'}
          </span>
        </div>
      </Card>

      <ResponsiveTable
        columns={[
          { 
            key: 'data', 
            header: 'Data', 
            render: (value, item) => formatDate(item.data || item.createdAt) 
          },
          { 
            key: 'grupo', 
            header: 'Grupo', 
            render: (value, item) => getGroupName(item.groupId) 
          },
          { key: 'descricao', header: 'Descrição' },
          { 
            key: 'type', 
            header: 'Tipo', 
            render: (value, item) => (
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                item.type === 'ENTRADA' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {item.type === 'ENTRADA' ? <ArrowUpCircle className="w-3 h-3" /> : <ArrowDownCircle className="w-3 h-3" />}
                {item.type === 'ENTRADA' ? 'Entrada' : 'Saída'}
              </span>
            )
          },
          { 
            key: 'paymentType', 
            header: 'Pagamento', 
            render: (value, item) => {
              if (item.paymentType === 'PIX') return 'PIX';
              if (item.paymentType === 'DINHEIRO') return 'Dinheiro';
              if (item.paymentType === 'CARTAO_CREDITO') return 'Cartão Crédito';
              if (item.paymentType === 'CARTAO_DEBITO') return 'Cartão Débito';
              if (item.paymentType === 'TRANSFERENCIA') return 'Transferência';
              return '-';
            }
          },
          { 
            key: 'valor', 
            header: 'Valor', 
            render: (value, item) => (
              <span className={`font-semibold ${item.type === 'ENTRADA' ? 'text-success' : 'text-danger'}`}>
                {item.type === 'ENTRADA' ? '+' : '-'} {formatCurrency(item.valor)}
              </span>
            )
          },
          { 
            key: 'user', 
            header: 'Criado por', 
            render: (value, item) => item.user?.nome || 'Sistema' 
          },
        ]}
        data={filteredTransactions}
        onEdit={handleOpenEditModal}
        canEdit={canEditTransaction}
      />
      
      {/* Botão Mobile Floating Action Button */}
      {canCreateTransaction && (
        <button
          onClick={() => router.push('/transacoes/nova')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-success text-white rounded-full shadow-lg hover:bg-green-700 transition-all hover:scale-110 flex items-center justify-center z-50 md:hidden"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

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