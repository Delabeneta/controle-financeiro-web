/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/(protected)/grupos/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { groupsAPI, transactionsAPI } from '@/src/lib/api';
import { Card } from '@/components/card';
import { Button } from '@/src/components/ui/button';
import { Breadcrumb } from '@/components/BreadCrumb';
import { 
  ArrowLeft, 
  Plus, 
  ArrowUpCircle, 
  ArrowDownCircle,
  User,
  Filter,
  Loader2,
  CreditCard,
  Banknote,
  Calendar,
} from 'lucide-react';
import { ResponsiveTable } from '@/components/ResponsiveTable';

type TabType = 'transacoes' | 'membros';

export default function GrupoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;
  
  const [activeTab, setActiveTab] = useState<TabType>('transacoes');
  const [filterType, setFilterType] = useState<'all' | 'ENTRADA' | 'SAIDA'>('all');
  const [group, setGroup] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [saldos, setSaldos] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    
    try {
      const groupRes = await groupsAPI.getOne(id);
      setGroup(groupRes.data);
      
      const saldosRes = await groupsAPI.getSaldos(id);
      setSaldos(saldosRes.data);
      
      const transactionsRes = await transactionsAPI.getByGroup(id);
      setTransactions(transactionsRes.data || []);
      
    } catch (err: any) {
      console.error('Erro detalhado:', err);
      setError(err.response?.data?.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    setMembersLoading(true);
    try {
      setMembers([]);
    } catch (err) {
      console.error('Erro ao carregar membros:', err);
    } finally {
      setMembersLoading(false);
    }
  };

  const filteredTransactions = filterType === 'all'
    ? transactions
    : transactions.filter(t => t.type === filterType);

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

  const canEdit = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'LIDER';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="p-8">
        <Card className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Grupo não encontrado'}
          </h3>
          <Button onClick={() => router.push('/grupos')} className="mt-4">
            Voltar para Grupos
          </Button>
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
            { label: 'Grupos', path: '/grupos' },
            { label: group.nome },
          ]}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between mt-4 gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/grupos')}
              className="px-2 md:px-3"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{group.nome}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Criado em {new Date(group.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          
          {/* Botão Registrar Transação - Desktop */}
          {canEdit && (
            <Button
              onClick={() => router.push(`/transacoes/nova?groupId=${id}`)}
              className="bg-green-500 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Registrar Transação
            </Button>
          )}
        </div>
      </div>

      {/* Balance Cards */}
      {saldos && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-primary to-primary-dark text-white">
            <p className="text-white/80 mb-2">Saldo Total</p>
            <p className="text-3xl font-bold">{formatCurrency(saldos.saldoTotal)}</p>
          </Card>
          
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Saldo em Banco</p>
                <p className={`text-xl font-bold ${saldos.saldoBanco >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(saldos.saldoBanco)}
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
                <p className="text-sm text-gray-600 mb-1">Saldo em Caixa</p>
                <p className={`text-xl font-bold ${saldos.saldoCaixa >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(saldos.saldoCaixa)}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Banknote className="w-5 h-5 text-success" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('transacoes')}
            className={`pb-3 px-1 font-medium transition-colors relative ${
              activeTab === 'transacoes'
                ? 'text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Transações
            {activeTab === 'transacoes' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('membros');
              loadMembers();
            }}
            className={`pb-3 px-1 font-medium transition-colors relative ${
              activeTab === 'membros'
                ? 'text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Membros
            {activeTab === 'membros' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Transactions Tab */}
      {activeTab === 'transacoes' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-600 hidden sm:block" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todas</option>
                <option value="ENTRADA">Entradas</option>
                <option value="SAIDA">Saídas</option>
              </select>
            </div>
            <p className="text-sm text-gray-600">
              {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transação' : 'transações'}
            </p>
          </div>

          <ResponsiveTable
            columns={[
              { 
                key: 'data', 
                header: 'Data', 
                render: (value, item) => (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDate(item.data || item.createdAt)}
                  </div>
                )
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
                render: (value, item) => (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    {item.user?.nome || 'Sistema'}
                  </div>
                )
              },
            ]}
            data={filteredTransactions}
            onRowClick={(item) => console.log('Clicked transaction:', item)}
          />
        </div>
      )}

      {/* Membros Tab */}
      {activeTab === 'membros' && (
        <Card>
          {membersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Lista de Membros
              </h3>
              <p className="text-gray-600">
                Nenhum membro encontrado neste grupo.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                    {member.nome?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{member.nome}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {member.permission === 'EDITOR' ? 'Editor' : 'Leitor'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

    </div>
  );
}