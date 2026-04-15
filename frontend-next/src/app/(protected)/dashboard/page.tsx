'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { dashboardApi } from '@/src/lib/api';
import { StatCard } from '@/components/card';
import { Breadcrumb } from '@/components/BreadCrumb';
import { Plus, Wallet, Users, UsersRound, Loader2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type DashboardData = {
  totalBalance: number;
  activeGroups: number;
  totalMembers: number;
  chartData: { month: string; entradas: number; saidas: number }[];
  topGroups: {
    id: string;
    name: string;
    balance: number;
    memberCount: number;
  }[];
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        setLoading(true);

        const res = await dashboardApi.get(); // 🔥 BACKEND FAZ TUDO
        setDashboardData(res.data);
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Bem-vindo, {user?.nome}</p>
          </div>

        
        </div>
      </div>

      {/* Cards */}
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
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">
          Entradas vs Saídas
        </h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dashboardData.chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="entradas" fill="#10B981" />
            <Bar dataKey="saidas" fill="#EF4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Groups */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">
          Top Grupos
        </h2>

        <div className="space-y-3">
          {dashboardData.topGroups.map((group, index) => (
            <div
              key={group.id}
              onClick={() => router.push(`/grupos/${group.id}`)}
              className="flex justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
            >
              <div>
                <p className="font-medium">
                  {index + 1}. {group.name}
                </p>
                <p className="text-sm text-gray-600">
                  {group.memberCount} membros
                </p>
              </div>

              <div className="font-semibold">
                {formatCurrency(group.balance)}
              </div>
            </div>
          ))}
        </div>
      </div>

      </div>
  );
}