/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/StatementModal.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Calendar, FileText, ChevronDown, AlertCircle } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { StatementPDF } from './StatementPDF';

interface Group {
  id: string;
  nome: string;
}

interface StatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  selectedGroupId: string;
  treasurerName: string;
  transactions: any[];
  saldoPix: number;
  saldoDinheiro: number;
  saldoTotal: number;
}

type PeriodType = '15days' | '30days' | 'custom';

export function StatementModal({
  isOpen,
  onClose,
  groups,
  selectedGroupId,
  treasurerName,
  transactions,
  saldoPix,
  saldoDinheiro,
  saldoTotal,
}: StatementModalProps) {
  const [periodType, setPeriodType] = useState<PeriodType>('30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>(selectedGroupId);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [dateError, setDateError] = useState('');
  
  const prevIsOpenRef = useRef(isOpen);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedGroup(selectedGroupId);
      setStartDate('');
      setEndDate('');
      setDateError('');
      setPeriodType('30days');
    }
    prevIsOpenRef.current = isOpen;
     
  }, [isOpen, selectedGroupId]);

  if (!isOpen) return null;

  const getGroupName = () => {
    const group = groups.find(g => g.id === selectedGroup);
    return group?.nome || 'Selecione um grupo';
  };

  const validateDates = (start: string, end: string): boolean => {
    if (!start || !end) {
      setDateError('Selecione as datas inicial e final');
      return false;
    }

    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      setDateError('Datas inválidas');
      return false;
    }

    if (startDateObj > endDateObj) {
      setDateError('Data inicial não pode ser maior que data final');
      return false;
    }

    if (endDateObj > today) {
      setDateError('Data final não pode ser maior que hoje');
      return false;
    }

    const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 60) {
      setDateError(`Período máximo de 60 dias (selecionado: ${diffDays} dias)`);
      return false;
    }

    setDateError('');
    return true;
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (endDate) {
      validateDates(value, endDate);
    } else {
      setDateError('');
    }
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    if (startDate) {
      validateDates(startDate, value);
    } else {
      setDateError('');
    }
  };

    const getDateRange = (): { start: Date | null; end: Date | null } => {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // final do dia de hoje

      if (periodType === '15days') {
        const start = new Date();
        start.setDate(start.getDate() - 15);
        start.setHours(0, 0, 0, 0); // início do dia
        return { start, end: today };
      }

      if (periodType === '30days') {
        const start = new Date();
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        return { start, end: today };
      }

      if (periodType === 'custom' && startDate && endDate) {
        const [sy, sm, sd] = startDate.split('-').map(Number);
        const [ey, em, ed] = endDate.split('-').map(Number);
        const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);   // local meia-noite
        const end = new Date(ey, em - 1, ed, 23, 59, 59, 999); // local fim do dia
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          return { start, end };
        }
      }

      return { start: null, end: null };
    };

  const filterTransactionsByGroupAndDate = () => {
    const { start, end } = getDateRange();
    
    if (!start || !end) {
      return { entries: [], expenses: [], groupTransactionsTotal: 0, groupPixTotal: 0, groupDinheiroTotal: 0 };
    }
    
    const filtered = transactions.filter((t) => {
      const tDate = new Date(t.data || t.createdAt);
      const matchesGroup = selectedGroup === 'all' ? true : t.groupId === selectedGroup;
      return matchesGroup && tDate >= start && tDate <= end;
    });

    const entries = filtered.filter((t) => t.type === 'ENTRADA');
    const expenses = filtered.filter((t) => t.type === 'SAIDA');

    const groupTransactionsTotal = filtered.reduce((sum, t) => {
      return sum + (t.type === 'ENTRADA' ? t.valor : -t.valor);
    }, 0);

    const groupPixTotal = filtered.reduce((sum, t) => {
      if (t.paymentType !== 'PIX') return sum;
      return sum + (t.type === 'ENTRADA' ? t.valor : -t.valor);
    }, 0);

    const groupDinheiroTotal = filtered.reduce((sum, t) => {
      if (t.paymentType !== 'DINHEIRO') return sum;
      return sum + (t.type === 'ENTRADA' ? t.valor : -t.valor);
    }, 0);

    return { entries, expenses, groupTransactionsTotal, groupPixTotal, groupDinheiroTotal };
  };

  const getCurrentBalances = () => {
    const groupTransactions = transactions.filter((t) => {
      const matchesGroup = selectedGroup === 'all' ? true : t.groupId === selectedGroup;
      return matchesGroup;
    });

    const currentTotal = groupTransactions.reduce((sum, t) => {
      return sum + (t.type === 'ENTRADA' ? t.valor : -t.valor);
    }, 0);

    const currentPix = groupTransactions.reduce((sum, t) => {
      if (t.paymentType !== 'PIX') return sum;
      return sum + (t.type === 'ENTRADA' ? t.valor : -t.valor);
    }, 0);

    const currentDinheiro = groupTransactions.reduce((sum, t) => {
      if (t.paymentType !== 'DINHEIRO') return sum;
      return sum + (t.type === 'ENTRADA' ? t.valor : -t.valor);
    }, 0);

    return { currentTotal, currentPix, currentDinheiro };
  };
  
  const { entries, expenses, groupTransactionsTotal, groupPixTotal, groupDinheiroTotal } = filterTransactionsByGroupAndDate();
  const { currentTotal, currentPix, currentDinheiro } = getCurrentBalances();
  const { start, end } = getDateRange();

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const isCustomValid = () => {
    if (periodType !== 'custom') return true;
    return startDate && endDate && !dateError;
  };

  const canGeneratePDF = () => {
    if (!selectedGroup) return false;
    if (periodType === 'custom') {
      return isCustomValid();
    }
    return true;
  };

  const getPDFDocument = () => {
    const { start, end } = getDateRange();
    if (!start || !end) return null;
    
    return (
      <StatementPDF
        groupName={getGroupName()}
        treasurerName={treasurerName}
        startDate={start.toISOString()}
        endDate={end.toISOString()}
        entries={entries}
        expenses={expenses}
        saldoPeriodo={groupTransactionsTotal}
        saldoPixPeriodo={groupPixTotal}
        saldoDinheiroPeriodo={groupDinheiroTotal}
        saldoTotalAtual={currentTotal}
        saldoPixAtual={currentPix}
        saldoDinheiroAtual={currentDinheiro}
        currentDate={currentDate}
      />
    );
  };

  const getMaxDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const pdfDocument = getPDFDocument();
  const isPDFReady = canGeneratePDF() && pdfDocument !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Gerar Extrato</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grupo
            </label>
            <div className="relative">
              <button
                onClick={() => setIsGroupOpen(!isGroupOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <span className={selectedGroup ? 'text-gray-900' : 'text-gray-400'}>
                  {getGroupName()}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isGroupOpen ? 'rotate-180' : ''}`} />
              </button>
              {isGroupOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => {
                        setSelectedGroup(group.id);
                        setIsGroupOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        selectedGroup === group.id ? 'bg-primary/10 text-primary' : 'text-gray-700'
                      }`}
                    >
                      {group.nome}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {groups.length === 1 ? 'Apenas um grupo disponível' : 'Selecione o grupo para gerar o extrato'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setPeriodType('15days');
                  setDateError('');
                }}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  periodType === '15days'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                15 dias
              </button>
              <button
                onClick={() => {
                  setPeriodType('30days');
                  setDateError('');
                }}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  periodType === '30days'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                30 dias
              </button>
              <button
                onClick={() => {
                  setPeriodType('custom');
                  setDateError('');
                }}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  periodType === 'custom'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Personalizado
              </button>
            </div>
          </div>

          {periodType === 'custom' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Data inicial
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    max={getMaxDate()}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Data final
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    min={startDate}
                    max={getMaxDate()}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Máximo de 60 dias entre as datas
              </div>
              {dateError && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                  <AlertCircle className="w-3 h-3" />
                  {dateError}
                </div>
              )}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Calendar className="w-4 h-4" />
              <span>Resumo do período</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Entradas:</span>
              <span className="text-green-600 font-medium">
                {entries.length} registros
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Saídas:</span>
              <span className="text-red-600 font-medium">
                {expenses.length} registros
              </span>
            </div>
            <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200">
              <span>Saldo do período:</span>
              <span className={`font-medium ${groupTransactionsTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(groupTransactionsTotal)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          {isPDFReady ? (
            <PDFDownloadLink
              document={pdfDocument as any}
              fileName={`extrato_${getGroupName().replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`}
              className="flex-1"
            >
              {({ loading }) => (
                <button
                  disabled={loading}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Gerando PDF...' : 'Baixar Extrato'}
                </button>
              )}
            </PDFDownloadLink>
          ) : (
            <button
              disabled={true}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary/50 rounded-lg cursor-not-allowed"
            >
              Baixar Extrato
            </button>
          )}
        </div>
      </div>
    </div>
  );
}