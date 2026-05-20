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
    fontSize: 9,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  header: {
    marginBottom: 15,
    textAlign: 'center',
    borderBottom: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 10,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 8,
    color: '#999999',
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
    backgroundColor: '#f0f0f0',
    padding: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
    paddingVertical: 5,
    marginTop: 4,
    backgroundColor: '#f9f9f9',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
    paddingVertical: 4,
  },
  colDate: { width: '18%', fontSize: 8 },
  colType: { width: '15%', fontSize: 8 },
  colDesc: { width: '47%', fontSize: 8 },
  colValue: { width: '20%', fontSize: 8, textAlign: 'right' },
  headerDate: { width: '18%', fontSize: 8, fontWeight: 'bold' },
  headerType: { width: '15%', fontSize: 8, fontWeight: 'bold' },
  headerDesc: { width: '47%', fontSize: 8, fontWeight: 'bold' },
  headerValue: { width: '20%', fontSize: 8, fontWeight: 'bold', textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#cccccc',
  },
  totalLabel: { width: '80%', fontSize: 9, fontWeight: 'bold', textAlign: 'right' },
  totalValue: { width: '20%', fontSize: 9, fontWeight: 'bold', textAlign: 'right' },
  balanceCard: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  balanceLabel: { fontSize: 9, fontWeight: 'bold' },
  balanceValue: { fontSize: 9 },
  content: {
    flex: 1,
    marginBottom: 120,
  },
  signatureSection: {
    position: 'absolute',
    bottom: 60,
    left: 30,
    right: 30,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  signatureBox: {
    width: '45%',
    textAlign: 'center',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    marginBottom: 6,
    marginTop: 0,
  },
  signatureTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  signatureRole: {
    fontSize: 8,
    color: '#666666',
  },
  signatureCenter: {
    alignItems: 'center',
    marginTop: 0,
  },
  signatureCenterLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    width: '50%',
    marginBottom: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 7,
    color: '#999999',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 8,
  },
});

interface Transaction {
  id: string;
  descricao: string;
  type: 'ENTRADA' | 'SAIDA';
  paymentType: string;
  valor: number;
  data: string;
  groupId: string;
  groupName?: string;
}

interface StatementPDFProps {
  groupName: string;
  treasurerName: string;
  startDate: string;
  endDate: string;
  entries: Transaction[];
  expenses: Transaction[];
  saldoPeriodo: number;
  saldoPixPeriodo: number;
  saldoDinheiroPeriodo: number;
  saldoTotalAtual: number;
  saldoPixAtual: number;
  saldoDinheiroAtual: number;
  currentDate: string;
}

export function StatementPDF({
  groupName,
  treasurerName,
  startDate,
  endDate,
  entries,
  expenses,
  saldoPeriodo,
  saldoPixPeriodo,
  saldoDinheiroPeriodo,
  saldoTotalAtual,
  saldoPixAtual,
  saldoDinheiroAtual,
  currentDate,
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

  const getPaymentTypeLabel = (paymentType: string) => {
    const map: Record<string, string> = {
      PIX: 'PIX',
      DINHEIRO: 'Dinheiro',
      CARTAO_CREDITO: 'Cartão Crédito',
      CARTAO_DEBITO: 'Cartão Débito',
      TRANSFERENCIA: 'Transferência',
    };
    return map[paymentType] || paymentType;
  };

  const totalEntries = entries.reduce((sum, t) => sum + t.valor, 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + t.valor, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.groupName}>{groupName}</Text>
          <Text style={styles.subtitle}>EXTRATO FINANCEIRO</Text>
          <Text style={styles.dateText}>
            Período: {formatDate(startDate)} a {formatDate(endDate)}
          </Text>
          <Text style={styles.dateText}>Data de emissão: {currentDate}</Text>
        </View>

        <View style={styles.content}>
          <View>
            <Text style={styles.sectionTitle}>ENTRADAS</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.headerDate}>Data</Text>
              <Text style={styles.headerType}>Tipo</Text>
              <Text style={styles.headerDesc}>Descrição</Text>
              <Text style={styles.headerValue}>Valor</Text>
            </View>
            {entries.length === 0 ? (
              <View style={styles.tableRow}>
                <Text style={styles.colDesc}>Nenhuma entrada no período</Text>
              </View>
            ) : (
              entries.map((item, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={styles.colDate}>{formatDate(item.data)}</Text>
                  <Text style={styles.colType}>{getPaymentTypeLabel(item.paymentType)}</Text>
                  <Text style={styles.colDesc}>{item.descricao}</Text>
                  <Text style={[styles.colValue, { color: '#10b981' }]}>
                    + {formatCurrency(item.valor)}
                  </Text>
                </View>
              ))
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal Entradas</Text>
              <Text style={[styles.totalValue, { color: '#10b981' }]}>
                {formatCurrency(totalEntries)}
              </Text>
            </View>
          </View>

          <View>
            <Text style={styles.sectionTitle}>SAÍDAS</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.headerDate}>Data</Text>
              <Text style={styles.headerType}>Tipo</Text>
              <Text style={styles.headerDesc}>Descrição</Text>
              <Text style={styles.headerValue}>Valor</Text>
            </View>
            {expenses.length === 0 ? (
              <View style={styles.tableRow}>
                <Text style={styles.colDesc}>Nenhuma saída no período</Text>
              </View>
            ) : (
              expenses.map((item, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={styles.colDate}>{formatDate(item.data)}</Text>
                  <Text style={styles.colType}>{getPaymentTypeLabel(item.paymentType)}</Text>
                  <Text style={styles.colDesc}>{item.descricao}</Text>
                  <Text style={[styles.colValue, { color: '#ef4444' }]}>
                    - {formatCurrency(item.valor)}
                  </Text>
                </View>
              ))
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal Saídas</Text>
              <Text style={[styles.totalValue, { color: '#ef4444' }]}>
                - {formatCurrency(totalExpenses)}
              </Text>
            </View>
          </View>

          <View style={styles.balanceCard}>
            <Text style={[styles.sectionTitle, { marginTop: 0, backgroundColor: 'transparent', paddingLeft: 0, fontSize: 10 }]}>
              RESUMO DO PERÍODO
            </Text>
            

            <View style={{ borderTopWidth: 1, borderTopColor: '#e0e0e0', marginVertical: 8 }} />

            <View>
              <Text style={[styles.balanceLabel, { fontSize: 8, color: '#666', marginBottom: 4 }]}>
              </Text>
              <View style={styles.balanceRow}>
                <Text style={[styles.balanceLabel, { fontSize: 10 }]}>Saldo Total Atual</Text>
                <Text style={[
                  styles.balanceValue,
                  { fontWeight: 'bold', fontSize: 11, color: saldoTotalAtual >= 0 ? '#10b981' : '#ef4444' }
                ]}>
                  {formatCurrency(saldoTotalAtual)}
                </Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Saldo em Banco (PIX)</Text>
                <Text style={[styles.balanceValue, { fontWeight: 'bold' }]}>
                  {formatCurrency(saldoPixAtual)}
                </Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Saldo em Dinheiro</Text>
                <Text style={[styles.balanceValue, { fontWeight: 'bold' }]}>
                  {formatCurrency(saldoDinheiroAtual)}
                </Text>
              </View>
            </View>
          </View>
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
            </View>
          </View>

          <View style={styles.signatureCenter}>
            <View style={styles.signatureCenterLine} />
            <Text style={styles.signatureTitle}>Padre Responsável</Text>
            <Text style={styles.signatureRole}>Assinatura e Carimbo da Paróquia</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Documento gerado eletronicamente pelo sistema Gestão Financeira</Text>
          <Text>Este documento tem validade após assinado pelas partes responsáveis</Text>
        </View>
      </Page>
    </Document>
  );
}