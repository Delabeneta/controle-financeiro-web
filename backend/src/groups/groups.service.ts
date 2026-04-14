import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { Role } from '@prisma/client';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  // Calcular saldo total de um grupo específico
  async calcularSaldosDoGrupo(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: {
        saldoInicial: true, // ← INCLUIR EXPLICITAMENTE
        transactions: {
          select: {
            type: true,
            valor: true,
            paymentType: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    const saldoInicial = group.saldoInicial ? Number(group.saldoInicial) : 0;

    let totalEntradas = 0;
    let totalSaidas = 0;
    let saldoBanco = 0;
    let saldoCaixa = 0;

    for (const transaction of group.transactions) {
      const valor = Number(transaction.valor);
      const isEntrada = transaction.type === 'ENTRADA';

      if (isEntrada) {
        totalEntradas += valor;
      } else {
        totalSaidas += valor;
      }

      const isBanco =
        transaction.paymentType &&
        ['PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'TRANSFERENCIA'].includes(
          transaction.paymentType,
        );
      const isCaixa = transaction.paymentType === 'DINHEIRO';

      if (isEntrada) {
        if (isBanco) saldoBanco += valor;
        if (isCaixa) saldoCaixa += valor;
      } else {
        if (isBanco) saldoBanco -= valor;
        if (isCaixa) saldoCaixa -= valor;
      }
    }

    const saldoTotal = saldoInicial + totalEntradas - totalSaidas;

    return {
      saldoInicial,
      saldoTotal,
      saldoBanco,
      saldoCaixa,
      totalEntradas,
      totalSaidas,
    };
  }
  // Buscar grupo com saldo calculado
  async getGroupWithBalance(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        transactions: {
          orderBy: { data: 'desc' },
        },
        organization: true,
        users: {
          include: { user: true },
        },
      },
    });

    if (!group) throw new Error('Grupo não encontrado');

    const saldoTotal = await this.calcularSaldosDoGrupo(groupId);

    return {
      ...group,
      saldoInicial: group.saldoInicial ? Number(group.saldoInicial) : null,
      saldoTotal,
      transactions: group.transactions.map((t) => ({
        ...t,
        valor: Number(t.valor),
      })),
    };
  }

  // Listar todos os grupos de uma organização com saldos
  async listGroupsWithBalances(organizationId: string) {
    const groups = await this.prisma.group.findMany({
      where: { organizationId },
      include: {
        transactions: true,
        _count: {
          select: { users: true, transactions: true },
        },
      },
    });

    const groupsWithBalance = await Promise.all(
      groups.map(async (group) => {
        const saldoTotal = await this.calcularSaldosDoGrupo(group.id);
        return {
          ...group,
          saldoInicial: group.saldoInicial ? Number(group.saldoInicial) : null,
          saldoTotal,
          transactions: group.transactions.map((t) => ({
            ...t,
            valor: Number(t.valor),
          })),
        };
      }),
    );

    return groupsWithBalance;
  }

  async updateSaldoInicial(
    groupId: string,
    saldoInicial: number,
    user: { id: string; role: Role; organizationId: string | null },
  ) {
    // Primeiro, verificar se o grupo existe
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { organization: true },
    });

    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    // SUPER_ADMIN pode editar qualquer grupo
    if (user.role === Role.SUPER_ADMIN) {
      return await this.prisma.group.update({
        where: { id: groupId },
        data: { saldoInicial },
      });
    }

    // ADMIN só pode editar grupos da sua organização
    if (user.role === Role.ADMIN) {
      if (group.organizationId !== user.organizationId) {
        throw new ForbiddenException(
          'Você só pode editar saldo de grupos da sua organização',
        );
      }
      return await this.prisma.group.update({
        where: { id: groupId },
        data: { saldoInicial },
      });
    }
  }

  // Adicione este método ao GroupsService
  // groups.service.ts
  async getTransactionsByPaymentType(groupId: string, paymentType?: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    const transactions = await this.prisma.transaction.findMany({
      where: {
        groupId: groupId,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ...(paymentType && { paymentType: paymentType as any }),
      },
      orderBy: { data: 'desc' },
      include: {
        user: {
          select: { id: true, nome: true, email: true },
        },
      },
    });

    const transactionsWithNumbers = transactions.map((t) => ({
      ...t,
      valor: Number(t.valor), // ← Converte Decimal para number
    }));

    // Calcular totais por tipo de pagamento
    const totalsByPaymentType = transactionsWithNumbers.reduce(
      (acc, transaction) => {
        const type = transaction.paymentType || 'NAO_INFORMADO';
        if (!acc[type]) {
          acc[type] = { entradas: 0, saidas: 0, total: 0 };
        }

        if (transaction.type === 'ENTRADA') {
          acc[type].entradas += transaction.valor;
          acc[type].total += transaction.valor;
        } else {
          acc[type].saidas += transaction.valor;
          acc[type].total -= transaction.valor;
        }

        return acc;
      },
      {} as Record<string, { entradas: number; saidas: number; total: number }>,
    );

    return {
      transactions: transactionsWithNumbers, // ← Retorna com number
      totalsByPaymentType,
      totalGeral: transactionsWithNumbers.reduce((sum, t) => {
        return sum + (t.type === 'ENTRADA' ? t.valor : -t.valor);
      }, 0),
    };
  }
  async create(
    data: CreateGroupDto,
    user: { id: string; role: Role; organizationId: string | null },
  ) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: data.organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organização não encontrada');
    }

    // SUPER_ADMIN pode criar grupo em qualquer organização
    if (user.role === Role.SUPER_ADMIN) {
      return this.prisma.group.create({
        data: {
          nome: data.nome,
          organizationId: data.organizationId,
          saldoInicial: data.saldoInicial || 0,
        },
        include: { organization: true },
      });
    }

    // ADMIN só pode criar grupo na sua própria organização
    if (user.role === Role.ADMIN) {
      if (user.organizationId !== data.organizationId) {
        throw new ForbiddenException(
          'Você só pode criar grupos na sua própria organização',
        );
      }
      return this.prisma.group.create({
        data: {
          nome: data.nome,
          organizationId: data.organizationId,
          saldoInicial: data.saldoInicial || 0,
        },
        include: { organization: true },
      });
    }

    throw new ForbiddenException('Apenas administradores podem criar grupos');
  }

  async findAll(user: {
    id: string;
    role: Role;
    organizationId: string | null;
  }) {
    // SUPER_ADMIN vê TODOS os grupos de TODAS organizações
    if (user.role === Role.SUPER_ADMIN) {
      return this.prisma.group.findMany({
        include: {
          organization: true,
          _count: { select: { users: true, transactions: true } },
        },
        orderBy: { nome: 'asc' },
      });
    }

    // ADMIN vê todos os grupos da sua organização
    if (user.role === Role.ADMIN) {
      return this.prisma.group.findMany({
        where: { organizationId: user.organizationId! },
        include: {
          organization: true,
          _count: { select: { users: true, transactions: true } },
        },
        orderBy: { nome: 'asc' },
      });
    }

    // LÍDER vê apenas os grupos que está associado
    return this.prisma.group.findMany({
      where: {
        users: {
          some: { userId: user.id },
        },
      },
      include: {
        organization: true,
        _count: { select: { users: true, transactions: true } },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(
    id: string,
    user: { id: string; role: Role; organizationId: string | null },
  ) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        organization: true,
        users: {
          include: {
            user: { select: { id: true, nome: true, email: true, role: true } },
          },
        },
        _count: { select: { transactions: true } },
      },
    });

    if (!group) throw new NotFoundException('Grupo não encontrado');

    // Verificar permissão de acesso
    // SUPER_ADMIN vê qualquer grupo
    if (user.role === Role.SUPER_ADMIN) {
      return group;
    }

    // ADMIN só vê grupos da sua organização
    if (user.role === Role.ADMIN) {
      if (group.organizationId !== user.organizationId) {
        throw new ForbiddenException(
          'Você não tem permissão para acessar este grupo',
        );
      }
      return group;
    }

    // LÍDER só vê grupos que participa
    const isMember = group.users.some(
      (userGroup) => userGroup.userId === user.id,
    );
    if (!isMember) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este grupo',
      );
    }

    return group;
  }
}
