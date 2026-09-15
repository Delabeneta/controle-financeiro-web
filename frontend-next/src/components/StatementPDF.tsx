// src/components/StatementPDF.tsx
'use client';

import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxP.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/roboto/v27/KFOlCnqEu92Fr1MmWUlfBBc9.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 10,
  },
  headerLeft: { flex: 1 },
  headerRight: { flex: 1, textAlign: 'right' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  headerSubtitle: { fontSize: 12, color: '#666666', marginTop: 2 },
  headerDetail: { fontSize: 10, color: '#555555', marginTop: 3 },

  summarySection: {
    marginTop: 8,
    marginBottom: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#cccccc',
    borderStyle: 'dashed',
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: { flex: 1, textAlign: 'center' },
  summaryLabel: {
    fontSize: 8,
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    textTransform: 'uppercase',
    color: '#333333',
    letterSpacing: 0.5,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingVertical: 6,
    marginTop: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
    paddingVertical: 5,
  },

  colDate: { width: '12%', fontSize: 9 },
  colType: { width: '10%', fontSize: 9 },
  colDesc: { width: '33%', fontSize: 9 },
  colPayment: { width: '15%', fontSize: 9 },
  colValue: { width: '15%', fontSize: 9, textAlign: 'right' },
  colBalance: { width: '15%', fontSize: 9, textAlign: 'right' },

  headerDate: { width: '12%', fontSize: 9, fontWeight: 'bold' },
  headerType: { width: '10%', fontSize: 9, fontWeight: 'bold' },
  headerDesc: { width: '33%', fontSize: 9, fontWeight: 'bold' },
  headerPayment: { width: '15%', fontSize: 9, fontWeight: 'bold' },
  headerValue: { width: '15%', fontSize: 9, fontWeight: 'bold', textAlign: 'right' },
  headerBalance: { width: '15%', fontSize: 9, fontWeight: 'bold', textAlign: 'right' },

  content: {
    flex: 1,
    marginBottom: 140,
  },

  signatureSection: {
    position: 'absolute',
    bottom: 70,
    left: 30,
    right: 30,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  signatureBox: { width: '45%', textAlign: 'center' },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    marginBottom: 5,
    marginTop: 0,
  },
  signatureTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 3 },
  signatureRole: { fontSize: 8, color: '#666666' },
  signatureCenter: { alignItems: 'center', marginTop: 0 },
  signatureCenterLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    width: '50%',
    marginBottom: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 35,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#999999',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 8,
  },
  footerText: { fontSize: 8, color: '#999999', marginTop: 3 },
});

interface Movement {
  id: string;
  descricao: string;
  type: 'ENTRADA' | 'SAIDA';
  paymentType: string;
  valor: number;
  data: string;
  createdAt: string;
  groupId: string;
  groupName?: string;
}

interface StatementPDFProps {
  groupName: string;
  treasurerName: string;
  bankAccount?: string;
  agency?: string;
  startDate: string;
  endDate: string;
  movements: Movement[];
  saldoInicial: number;
  totalEntradas: number;
  totalSaidas: number;
  saldoFinal: number;
  currentDate: string;
  paymentFilter?: 'all' | 'PIX' | 'DINHEIRO';
}

export function StatementPDF({
  groupName,
  treasurerName,
  bankAccount = '',
  agency = '',
  startDate,
  endDate,
  movements,
  saldoInicial,
  totalEntradas,
  totalSaidas,
  saldoFinal,
  currentDate,
  paymentFilter = 'all',
}: StatementPDFProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const ascendingMovements = [...movements].sort((a, b) => {
    const dateA = new Date(a.data || a.createdAt).getTime();
    const dateB = new Date(b.data || b.createdAt).getTime();
    return dateA - dateB;
  });

  const balanceMap = new Map<string, number>();
  let runningBalance = saldoInicial;

  ascendingMovements.forEach((item) => {
    const valor = item.type === 'ENTRADA' ? item.valor : -item.valor;
    runningBalance += valor;
    balanceMap.set(item.id, runningBalance);
  });

  const sortedMovements = [...movements].sort((a, b) => {
    const dateA = new Date(a.data || a.createdAt).getTime();
    const dateB = new Date(b.data || b.createdAt).getTime();
    return dateB - dateA;
  });

  const getTypeLabel = (type: string) => {
    return type === 'ENTRADA' ? 'Entrada' : 'Saída';
  };

  const getPaymentLabel = (paymentType: string) => {
    const map: Record<string, string> = {
      PIX: 'PIX',
      DINHEIRO: 'Dinheiro',
      TRANSFERENCIA: 'Transferência',
    };
    return map[paymentType?.toUpperCase()] || paymentType;
  };

  const filterLabel = paymentFilter === 'all'
    ? 'TODAS AS MOVIMENTAÇÕES'
    : paymentFilter === 'PIX'
    ? 'MOVIMENTAÇÕES PIX'
    : 'MOVIMENTAÇÕES EM DINHEIRO';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>EXTRATO DE CONTA</Text>
            <Text style={styles.headerSubtitle}>{groupName}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerDetail}>Tesoureiro: {treasurerName}</Text>
            {bankAccount && (
              <Text style={styles.headerDetail}>Conta: {bankAccount}</Text>
            )}
            {agency && (
              <Text style={styles.headerDetail}>Agência: {agency}</Text>
            )}
            <Text style={styles.headerDetail}>
              Período: De {formatDate(startDate)} a {formatDate(endDate)}
            </Text>
          </View>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Saldo Inicial</Text>
            <Text style={[styles.summaryValue, { color: '#3b82f6' }]}>
              {formatCurrency(saldoInicial)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Entradas</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>
              {formatCurrency(totalEntradas)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Saídas</Text>
            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
              - {formatCurrency(totalSaidas)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Saldo Atual</Text>
            <Text style={[styles.summaryValue, { color: saldoFinal >= 0 ? '#10b981' : '#ef4444' }]}>
              {formatCurrency(saldoFinal)}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>{filterLabel}</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.headerDate}>Data</Text>
            <Text style={styles.headerType}>Tipo</Text>
            <Text style={styles.headerDesc}>Descrição</Text>
            <Text style={styles.headerPayment}>Pagamento</Text>
            <Text style={styles.headerValue}>Valor</Text>
            <Text style={styles.headerBalance}>Saldo</Text>
          </View>

          {sortedMovements.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={styles.colDesc}>Nenhuma movimentação no período</Text>
            </View>
          ) : (
            sortedMovements.map((item, idx) => {
              const balanceAfter = balanceMap.get(item.id) ?? 0;

              return (
                <View key={idx} style={styles.tableRow}>
                  <Text style={styles.colDate}>{formatDate(item.data || item.createdAt)}</Text>
                  <Text style={[styles.colType, { color: item.type === 'ENTRADA' ? '#10b981' : '#ef4444' }]}>
                    {getTypeLabel(item.type)}
                  </Text>
                  <Text style={styles.colDesc}>{item.descricao}</Text>
                  <Text style={styles.colPayment}>{getPaymentLabel(item.paymentType)}</Text>
                  <Text style={[styles.colValue, { color: item.type === 'ENTRADA' ? '#10b981' : '#ef4444' }]}>
                    {item.type === 'ENTRADA' ? '+' : '-'} {formatCurrency(item.valor)}
                  </Text>
                  <Text style={[styles.colBalance, { color: balanceAfter >= 0 ? '#1a1a1a' : '#ef4444' }]}>
                    {formatCurrency(balanceAfter)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureTitle}>{treasurerName}</Text>
              <Text style={styles.signatureRole}>Tesoureiro(a)</Text>
            </View>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureTitle}>Coordenador(a)</Text>
              <Text style={styles.signatureRole}>Coordenador(a) do Grupo</Text>
            </View>
          </View>

          <View style={styles.signatureCenter}>
            <View style={styles.signatureCenterLine} />
            <Text style={styles.signatureTitle}>Secretaria Paroquial</Text>
            <Text style={styles.signatureRole}>Assinatura e Carimbo da Paróquia</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Documento gerado eletronicamente pelo sistema Gestão Financeira</Text>
          <Text style={styles.footerText}>Data de geração: {currentDate}</Text>
          <Text style={styles.footerText}>
            Este documento tem validade após assinado pelas partes responsáveis
          </Text>
        </View>
      </Page>
    </Document>
  );
}