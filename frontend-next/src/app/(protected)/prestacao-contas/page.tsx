 
// src/app/(protected)/prestacao-contas/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { prestacaoContasAPI } from '@/src/lib/api';
import { Card } from '@/src/components/card';
import { Breadcrumb } from '@/src/components/BreadCrumb';
import { StatementModal } from '@/src/components/StatementModal';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Receipt,
  Loader2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
} from 'lucide-react';

const NOTA_FISCAL_URL = 'https://contai-finance.netlify.app';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface StatusItem {
  groupId: string;
  groupName: string;
  mes: number;
  ano: number;
  status: 'FEITO' | 'PENDENTE';
  updatedByName: string | null;
  updatedAt: string | null;
}

// A prestação de contas tem como referência o dia 15 de cada mês:
//  - mais de 3 dias antes do dia 15 (ou já "Feito"): normal
//  - de 1 a 3 dias antes do dia 15: amarelo (prazo próximo)
//  - a partir do dia 15, ainda pendente: vermelho (atrasado)
function getHighlight(status: 'FEITO' | 'PENDENTE', mes: number, ano: number): 'none' | 'yellow' | 'red' {
  if (status === 'FEITO') return 'none';

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const prazo = new Date(ano, mes - 1, 15);

  const diffDays = Math.round((prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 3) return 'none';
  if (diffDays >= 1) return 'yellow';
  return 'red';
}

export default function PrestacaoContasPage() {
  const { user } = useAuth();
  const canEditStatus = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const today = new Date();
  const [mes, setMes] = useState(today.getMonth() + 1);
  const [ano, setAno] = useState(today.getFullYear());

  const [items, setItems] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingGroupId, setSavingGroupId] = useState<string | null>(null);

  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await prestacaoContasAPI.getAll(mes, ano);
      setItems(res.data);
    } catch (err) {
      console.error('Erro ao carregar prestação de contas:', err);
      setError('Não foi possível carregar a prestação de contas.');
    } finally {
      setLoading(false);
    }
  }, [mes, ano]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrevMonth = () => {
    if (mes === 1) {
      setMes(12);
      setAno((a) => a - 1);
    } else {
      setMes((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (mes === 12) {
      setMes(1);
      setAno((a) => a + 1);
    } else {
      setMes((m) => m + 1);
    }
  };

  const handleToggleStatus = async (item: StatusItem) => {
    if (!canEditStatus) return;
    const novoStatus = item.status === 'FEITO' ? 'PENDENTE' : 'FEITO';

    try {
      setSavingGroupId(item.groupId);
      await prestacaoContasAPI.update({
        groupId: item.groupId,
        mes: item.mes,
        ano: item.ano,
        status: novoStatus,
      });
      await loadData();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError('Não foi possível atualizar o status. Tente novamente.');
    } finally {
      setSavingGroupId(null);
    }
  };

  const groupsForStatement = items.map((i) => ({ id: i.groupId, nome: i.groupName }));

  const rowStyles: Record<'none' | 'yellow' | 'red', string> = {
    none: 'bg-white',
    yellow: 'bg-yellow-50 border-l-4 border-l-yellow-400',
    red: 'bg-red-50 border-l-4 border-l-red-400',
  };

  return (
    <div>
      <div className="mb-6">
        <Breadcrumb items={[{ label: 'Prestação de Contas' }]} />
        <div className="mt-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Prestação de Contas</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Acompanhe e organize a prestação de contas de cada grupo
          </p>
        </div>
      </div>

      {/* Instruções */}
      <Card className="mb-6 bg-blue-50 border-blue-100">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700 space-y-1">
            <p className="font-medium text-gray-900">Como prestar contas</p>
            <p>
              Até o dia 15 de cada mês, gere o extrato do grupo referente ao período e entregue à
              secretaria paroquial. Movimentações avulsas que não tiveram nota fiscal podem ser
              registradas na ferramenta de nota fiscal abaixo. Depois de entregue, o administrador ou
              coordenador marca a prestação do grupo como <strong>Feito</strong>.
            </p>
          </div>
        </div>
      </Card>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={() => setIsStatementModalOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          <FileText className="w-4 h-4" />
          Gerar Extrato
        </button>
        <a
          href={NOTA_FISCAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          <Receipt className="w-4 h-4" />
          Gerar Nota Fiscal
          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
        </a>
      </div>

      {/* Navegação de mês */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
          {MESES[mes - 1]} {ano}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          aria-label="Próximo mês"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Tabela de status */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-sm text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            Nenhum grupo encontrado.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => {
              const highlight = getHighlight(item.status, item.mes, item.ano);
              const isFeito = item.status === 'FEITO';
              const isSaving = savingGroupId === item.groupId;

              return (
                <div
                  key={item.groupId}
                  className={`flex items-center justify-between px-4 py-3 md:px-6 md:py-4 transition-colors ${rowStyles[highlight]}`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.groupName}</p>
                    {isFeito && item.updatedByName && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Marcado por {item.updatedByName}
                      </p>
                    )}
                    {highlight === 'red' && (
                      <p className="text-xs text-red-600 mt-0.5">Prazo vencido</p>
                    )}
                    {highlight === 'yellow' && (
                      <p className="text-xs text-yellow-700 mt-0.5">Prazo próximo (dia 15)</p>
                    )}
                  </div>

                  {canEditStatus ? (
                    <button
                      onClick={() => handleToggleStatus(item)}
                      disabled={isSaving}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors disabled:opacity-60 ${
                        isFeito
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {isSaving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isFeito ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      {isFeito ? 'Feito' : 'Pendente'}
                    </button>
                  ) : (
                    <span
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                        isFeito ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {isFeito ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {isFeito ? 'Feito' : 'Pendente'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <StatementModal
        key={isStatementModalOpen ? 'open' : 'closed'}
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        groups={groupsForStatement}
        selectedGroupId={groupsForStatement[0]?.id || ''}
        treasurerName={user?.nome || 'Usuário'}
      />
    </div>
  );
}