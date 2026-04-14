// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { usersAPI, transactionsAPI } from '@/src/lib/api';
import { StatCard } from '@/components/card';
import { Button } from '@/src/components/ui/button';
import { Breadcrumb } from '@/components/BreadCrumb';
import { Plus, Wallet, Users, UsersRound, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
  if (!user) return;
  
  try {
    setLoading(true);
    
    const groupsRes = await usersAPI.getMyGroups();
    const groups = groupsRes.data.groups || [];
    
    const transactionsRes = await transactionsAPI.getAll();
    const transactions = Array.isArray(transactionsRes.data)
      ? transactionsRes.data
      : transactionsRes.data.transactions || [];
    
    const totalBalance = groups.reduce((sum: number, g: any) => sum + (g.saldoTotal || 0), 0);
    const activeGroups = groups.length;
    const totalMembers = groups.reduce((sum: number, g: any) => sum + (g.membersCount || 0), 0);

    // Últimos 6 meses reais a partir de hoje
    const today = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1);
      return {
        year: d.getFullYear(),
        month: d.getMonth(), // 0-11
        label: d.toLocaleDateString('pt-BR', { month: 'short' })
          .replace('.', '')
          .replace(/^\w/, c => c.toUpperCase()),
      };
    });

    const monthlyData = last6Months.map(({ year, month, label }) => {
      const monthTransactions = transactions.filter((t: any) => {
        const d = new Date(t.data || t.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      });

      const entradas = monthTransactions
        .filter((t: any) => t.type === 'ENTRADA')
        .reduce((sum: number, t: any) => sum + (Number(t.valor) || 0), 0);

      const saidas = monthTransactions
        .filter((t: any) => t.type === 'SAIDA')
        .reduce((sum: number, t: any) => sum + (Number(t.valor) || 0), 0);

      return { month: label, entradas, saidas };
    });

    const topGroups = groups
      .sort((a: any, b: any) => (b.saldoTotal || 0) - (a.saldoTotal || 0))
      .slice(0, 5)
      .map((g: any) => ({
        id: g.id,
        name: g.nome,
        balance: g.saldoTotal || 0,
        memberCount: g.membersCount || 0,
      }));

    setDashboardData({ totalBalance, activeGroups, totalMembers, chartData: monthlyData, topGroups });

  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
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

  const formatTooltipValue = (value: number | string | undefined) => {
    if (value === undefined || value === null) return 'R$ 0,00';
    const numValue = typeof value === 'number' ? value : Number(value);
    if (isNaN(numValue)) return 'R$ 0,00';
    return formatCurrency(numValue);
  };

  if (loading || !dashboardData) {
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
        <Breadcrumb items={[{ label: 'Dashboard' }]} />
        <div className="flex flex-col md:flex-row md:items-center justify-between mt-4 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Bem-vindo, {user?.nome}
            </p>
          </div>
          <Button 
            onClick={() => router.push('/transacoes/nova')} 
            className="bg-success hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Saldo Total"
          value={formatCurrency(dashboardData.totalBalance)}
          icon={<Wallet className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Total de Grupos"
          value={dashboardData.activeGroups}
          icon={<UsersRound className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Total de Membros"
          value={dashboardData.totalMembers}
          icon={<Users className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Chart */}
      {dashboardData.chartData.some((d: any) => d.entradas > 0 || d.saidas > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-8">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">
            Entradas vs Saídas
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis 
                stroke="#6b7280" 
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                formatter={formatTooltipValue}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                labelStyle={{ fontWeight: 'bold', color: '#374151' }}
              />
              <Legend wrapperStyle={{ fontSize: '14px' }} />
              <Bar dataKey="entradas" fill="#10B981" name="Entradas" radius={[8, 8, 0, 0]} />
              <Bar dataKey="saidas" fill="#EF4444" name="Saídas" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Groups */}
      {dashboardData.topGroups.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">
            Top Grupos por Saldo
          </h2>
          <div className="space-y-3 md:space-y-4">
            {dashboardData.topGroups.map((group: any, index: number) => (
              <div
                key={group.id}
                className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => router.push(`/grupos/${group.id}`)}
              >
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm md:text-base flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm md:text-base truncate">{group.name}</h3>
                    <p className="text-xs md:text-sm text-gray-600">{group.memberCount} membros</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="font-semibold text-gray-900 text-sm md:text-base">{formatCurrency(group.balance)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => router.push('/transacoes/nova')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-success text-white rounded-full shadow-lg hover:bg-green-700 transition-all hover:scale-110 flex items-center justify-center md:hidden z-50"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}