// backend/prisma/seed.ts
import { PrismaClient, PaymentType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // 1. Limpar dados existentes
  console.log('🗑️  Limpando dados existentes...');
  await prisma.$executeRaw`TRUNCATE TABLE "Transaction" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "UserGroup" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Group" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Organization" CASCADE;`;

  // 2. Criar organização
  console.log('🏢 Criando organização...');
  const organization = await prisma.organization.create({
    data: {
      nome: 'Setor Juventude',
    },
  });

  // 3. Criar usuários
  console.log('👤 Criando usuários...');
  const hashedPassword = await bcrypt.hash('123456', 10);

  // Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      nome: 'Super Admin',
      email: 'super@email.com',
      senha: hashedPassword,
      role: 'SUPER_ADMIN',
      organizationId: null,
    },
  });

  // Admin da organização
  const admin = await prisma.user.create({
    data: {
      nome: 'Priscila',
      email: 'priscila@email.com',
      senha: hashedPassword,
      role: 'ADMIN',
      organizationId: organization.id,
    },
  });

  // Líderes
  const liderFAC = await prisma.user.create({
    data: {
      nome: 'Liz',
      email: 'liz@email.com',
      senha: hashedPassword,
      role: 'LIDER',
      organizationId: organization.id,
    },
  });

  const liderJOAM = await prisma.user.create({
    data: {
      nome: 'Walber',
      email: 'walber@email.com',
      senha: hashedPassword,
      role: 'LIDER',
      organizationId: organization.id,
    },
  });

  // 4. Criar grupos
  console.log('👥 Criando grupos...');

  const grupoFAC = await prisma.group.create({
    data: {
      nome: 'FAC',
      organizationId: organization.id,
      saldoInicial: 500,
    },
  });

  const grupoJOAM = await prisma.group.create({
    data: {
      nome: 'JOAM',
      organizationId: organization.id,
      saldoInicial: 200,
    },
  });

  // 5. Vincular líderes aos grupos
  console.log('🔗 Vinculando líderes aos grupos...');

  await prisma.userGroup.create({
    data: {
      userId: liderFAC.id,
      groupId: grupoFAC.id,
      permission: 'EDITOR',
      createdBy: admin.id,
    },
  });

  await prisma.userGroup.create({
    data: {
      userId: liderJOAM.id,
      groupId: grupoJOAM.id,
      permission: 'EDITOR',
      createdBy: admin.id,
    },
  });

  // 6. Criar transações para o grupo FAC (vendas de doces)
  console.log('💰 Criando transações para o grupo FAC...');

  const facTransactions = [
    {
      type: 'ENTRADA' as const,
      valor: 50.0,
      descricao: 'Venda de brigadeiros - Festa Junina',
      paymentType: 'DINHEIRO' as PaymentType,
      data: new Date('2024-03-01T10:00:00Z'),
      createdBy: liderFAC.id,
    },
    {
      type: 'ENTRADA' as const,
      valor: 35.5,
      descricao: 'Venda de cupcakes - Café da manhã',
      paymentType: 'PIX' as PaymentType,
      data: new Date('2024-03-05T14:30:00Z'),
      createdBy: liderFAC.id,
    },
    {
      type: 'ENTRADA' as const,
      valor: 120.0,
      descricao: 'Venda de trufas - Dia dos Namorados',
      paymentType: 'PIX' as PaymentType,
      data: new Date('2024-03-10T09:00:00Z'),
      createdBy: liderFAC.id,
    },
    {
      type: 'ENTRADA' as const,
      valor: 45.0,
      descricao: 'Venda de cookies - Reunião',
      paymentType: 'DINHEIRO' as PaymentType,
      data: new Date('2024-03-15T16:00:00Z'),
      createdBy: liderFAC.id,
    },
    {
      type: 'ENTRADA' as const,
      valor: 80.0,
      descricao: 'Venda de brownies - Evento especial',
      paymentType: 'PIX' as PaymentType,
      data: new Date('2024-03-20T11:00:00Z'),
      createdBy: liderFAC.id,
    },
    {
      type: 'ENTRADA' as const,
      valor: 30.0,
      descricao: 'Venda de pirulitos - Gincana',
      paymentType: 'DINHEIRO' as PaymentType,
      data: new Date('2024-03-25T15:30:00Z'),
      createdBy: liderFAC.id,
    },
    {
      type: 'ENTRADA' as const,
      valor: 95.0,
      descricao: 'Venda de tortas - Almoço',
      paymentType: 'PIX' as PaymentType,
      data: new Date('2024-04-02T12:00:00Z'),
      createdBy: liderFAC.id,
    },
    {
      type: 'ENTRADA' as const,
      valor: 60.0,
      descricao: 'Venda de docinhos - Casamento',
      paymentType: 'DINHEIRO' as PaymentType,
      data: new Date('2024-04-08T10:00:00Z'),
      createdBy: liderFAC.id,
    },
    {
      type: 'SAIDA' as const,
      valor: 150.0,
      descricao: 'Compra de ingredientes - Fornecedor',
      paymentType: 'PIX' as PaymentType,
      data: new Date('2024-03-18T09:00:00Z'),
      createdBy: liderFAC.id,
    },
    {
      type: 'SAIDA' as const,
      valor: 80.0,
      descricao: 'Embalagens personalizadas',
      paymentType: 'DINHEIRO' as PaymentType,
      data: new Date('2024-03-22T14:00:00Z'),
      createdBy: liderFAC.id,
    },
    {
      type: 'SAIDA' as const,
      valor: 200.0,
      descricao: 'Curso de confeitaria - Capacitação',
      paymentType: 'TRANSFERENCIA' as PaymentType,
      data: new Date('2024-03-28T08:00:00Z'),
      createdBy: liderFAC.id,
    },
  ];

  for (const tx of facTransactions) {
    await prisma.transaction.create({
      data: {
        ...tx,
        groupId: grupoFAC.id,
      },
    });
  }

  // 7. Criar transações para o grupo JOAM (vendas de refrigerante)
  console.log('💰 Criando transações para o grupo JOAM...');

  const joamTransactions = [
    {
      type: 'ENTRADA' as const,
      valor: 200.0,
      descricao: 'Venda de refrigerantes - Evento de abertura',
      paymentType: 'PIX' as PaymentType,
      data: new Date('2024-03-02T14:00:00Z'),
      createdBy: liderJOAM.id,
    },
    {
      type: 'ENTRADA' as const,
      valor: 150.0,
      descricao: 'Venda de Coca-Cola - Festa',
      paymentType: 'DINHEIRO' as PaymentType,
      data: new Date('2024-03-08T16:30:00Z'),
      createdBy: liderJOAM.id,
    },
    {
      type: 'ENTRADA' as const,
      valor: 100.0,
      descricao: 'Venda de Guaraná - Gincana',
      paymentType: 'PIX' as PaymentType,
      data: new Date('2024-03-12T11:00:00Z'),
      createdBy: liderJOAM.id,
    },
    {
      type: 'ENTRADA' as const,
      valor: 80.0,
      descricao: 'Venda de Fanta - Tarde de jogos',
      paymentType: 'DINHEIRO' as PaymentType,
      data: new Date('2024-03-18T15:00:00Z'),
      createdBy: liderJOAM.id,
    },
    {
      type: 'ENTRADA' as const,
      valor: 250.0,
      descricao: 'Venda de refrigerantes - Show musical',
      paymentType: 'PIX' as PaymentType,
      data: new Date('2024-03-22T19:00:00Z'),
      createdBy: liderJOAM.id,
    },
    {
      type: 'ENTRADA' as const,
      valor: 120.0,
      descricao: 'Venda de Sprite - Encontro jovem',
      paymentType: 'DINHEIRO' as PaymentType,
      data: new Date('2024-03-28T10:00:00Z'),
      createdBy: liderJOAM.id,
    },
    {
      type: 'ENTRADA' as const,
      valor: 300.0,
      descricao: 'Venda de refrigerantes - Acampamento',
      paymentType: 'PIX' as PaymentType,
      data: new Date('2024-04-05T08:00:00Z'),
      createdBy: liderJOAM.id,
    },
    {
      type: 'ENTRADA' as const,
      valor: 90.0,
      descricao: 'Venda de H2OH - Evento esportivo',
      paymentType: 'DINHEIRO' as PaymentType,
      data: new Date('2024-04-10T14:30:00Z'),
      createdBy: liderJOAM.id,
    },
    {
      type: 'SAIDA' as const,
      valor: 400.0,
      descricao: 'Compra de estoque - Distribuidora',
      paymentType: 'TRANSFERENCIA' as PaymentType,
      data: new Date('2024-03-15T09:00:00Z'),
      createdBy: liderJOAM.id,
    },
    {
      type: 'SAIDA' as const,
      valor: 180.0,
      descricao: 'Aluguel de freezer',
      paymentType: 'PIX' as PaymentType,
      data: new Date('2024-03-20T10:00:00Z'),
      createdBy: liderJOAM.id,
    },
    {
      type: 'SAIDA' as const,
      valor: 100.0,
      descricao: 'Material de divulgação',
      paymentType: 'DINHEIRO' as PaymentType,
      data: new Date('2024-03-25T13:00:00Z'),
      createdBy: liderJOAM.id,
    },
    {
      type: 'SAIDA' as const,
      valor: 250.0,
      descricao: 'Transporte para entrega',
      paymentType: 'PIX' as PaymentType,
      data: new Date('2024-04-01T07:00:00Z'),
      createdBy: liderJOAM.id,
    },
  ];

  for (const tx of joamTransactions) {
    await prisma.transaction.create({
      data: {
        ...tx,
        groupId: grupoJOAM.id,
      },
    });
  }

  // 8. Calcular saldos finais
  const saldoFAC = await calcularSaldoGrupo(grupoFAC.id);
  const saldoJOAM = await calcularSaldoGrupo(grupoJOAM.id);

  // 9. Resumo
  console.log('\n✅ Seed concluído com sucesso!\n');
  console.log('📊 Resumo:');
  console.log(`🏢 Organização: ${organization.nome}`);
  console.log(`👑 Super Admin: super@email.com / 123456`);
  console.log(`👤 Admin: priscila@email.com / 123456`);
  console.log(`👥 Líderes:`);
  console.log(`   - Liz (FAC): liz@email.com / 123456`);
  console.log(`   - Walber (JOAM): walber@email.com / 123456`);
  console.log(`📦 Grupos:`);
  console.log(`   - FAC: ${facTransactions.length} transações`);
  console.log(`   - JOAM: ${joamTransactions.length} transações`);
  console.log(`💰 Saldo FAC: R$ ${saldoFAC.toFixed(2)}`);
  console.log(`💰 Saldo JOAM: R$ ${saldoJOAM.toFixed(2)}`);
}

async function calcularSaldoGrupo(groupId: string): Promise<number> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { transactions: true },
  });

  if (!group) return 0;

  const saldoInicial = group.saldoInicial ? Number(group.saldoInicial) : 0;
  const entradas = group.transactions
    .filter((t) => t.type === 'ENTRADA')
    .reduce((sum, t) => sum + Number(t.valor), 0);
  const saidas = group.transactions
    .filter((t) => t.type === 'SAIDA')
    .reduce((sum, t) => sum + Number(t.valor), 0);

  return saldoInicial + entradas - saidas;
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
