// src/groups/groups.service.ts
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

  // ─── CALCULAR SALDOS DO GRUPO ─────────────────────────────────────────────────
  async calcularSaldosDoGrupo(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: {
        transactions: {
          select: {
            type: true,
            valor: true,
            paymentType: true,
          },
        },
      },
    });

    if (!group) throw new NotFoundException('Grupo não encontrado');

    let totalEntradas = 0;
    let totalSaidas = 0;
    let saldoBanco = 0;
    let saldoCaixa = 0;

    const tiposBanco = [
      'PIX',
      'CARTAO_CREDITO',
      'CARTAO_DEBITO',
      'TRANSFERENCIA',
    ];

    for (const t of group.transactions) {
      const valor = Number(t.valor);
      const isEntrada = t.type === 'ENTRADA';
      const isBanco = t.paymentType && tiposBanco.includes(t.paymentType);
      const isCaixa = t.paymentType === 'DINHEIRO';

      if (isEntrada) {
        totalEntradas += valor;
        if (isBanco) saldoBanco += valor;
        if (isCaixa) saldoCaixa += valor;
      } else {
        totalSaidas += valor;
        if (isBanco) saldoBanco -= valor;
        if (isCaixa) saldoCaixa -= valor;
      }
    }

    return {
      saldoTotal: totalEntradas - totalSaidas,
      saldoBanco,
      saldoCaixa,
      totalEntradas,
      totalSaidas,
    };
  }

  // ─── BUSCAR GRUPO COM SALDO ───────────────────────────────────────────────────
  async getGroupWithBalance(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        transactions: { orderBy: { data: 'desc' } },
        organization: true,
        users: { include: { user: true } },
      },
    });

    if (!group) throw new NotFoundException('Grupo não encontrado');

    const saldos = await this.calcularSaldosDoGrupo(groupId);

    return {
      ...group,
      ...saldos,
      transactions: group.transactions.map((t) => ({
        ...t,
        valor: Number(t.valor),
      })),
    };
  }

  // ─── LISTAR GRUPOS COM SALDOS ─────────────────────────────────────────────────
  async listGroupsWithBalances(organizationId: string) {
    const groups = await this.prisma.group.findMany({
      where: { organizationId },
      include: {
        transactions: true,
        _count: { select: { users: true, transactions: true } },
      },
    });

    return Promise.all(
      groups.map(async (group) => {
        const saldos = await this.calcularSaldosDoGrupo(group.id);
        return {
          ...group,
          ...saldos,
          transactions: group.transactions.map((t) => ({
            ...t,
            valor: Number(t.valor),
          })),
        };
      }),
    );
  }

  // ─── CRIAR GRUPO ──────────────────────────────────────────────────────────────
  async create(
    data: CreateGroupDto,
    user: { id: string; role: Role; organizationId: string | null },
  ) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: data.organizationId },
    });

    if (!organization)
      throw new NotFoundException('Organização não encontrada');

    if (user.role === Role.SUPER_ADMIN) {
      return this.prisma.group.create({
        data: {
          nome: data.nome,
          organizationId: data.organizationId,
        },
        include: { organization: true },
      });
    }

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
        },
        include: { organization: true },
      });
    }

    throw new ForbiddenException('Apenas administradores podem criar grupos');
  }

  // ─── LISTAR GRUPOS ────────────────────────────────────────────────────────────
  async findAll(user: {
    id: string;
    role: Role;
    organizationId: string | null;
  }) {
    if (user.role === Role.SUPER_ADMIN) {
      return this.prisma.group.findMany({
        include: {
          organization: true,
          _count: { select: { users: true, transactions: true } },
        },
        orderBy: { nome: 'asc' },
      });
    }

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

    return this.prisma.group.findMany({
      where: { users: { some: { userId: user.id } } },
      include: {
        organization: true,
        _count: { select: { users: true, transactions: true } },
      },
      orderBy: { nome: 'asc' },
    });
  }

  // ─── BUSCAR UM GRUPO ──────────────────────────────────────────────────────────
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

    if (user.role === Role.SUPER_ADMIN) return group;

    if (user.role === Role.ADMIN) {
      if (group.organizationId !== user.organizationId) {
        throw new ForbiddenException(
          'Você não tem permissão para acessar este grupo',
        );
      }
      return group;
    }

    const isMember = group.users.some((ug) => ug.userId === user.id);
    if (!isMember) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este grupo',
      );
    }

    return group;
  }

  // ─── TRANSAÇÕES POR TIPO DE PAGAMENTO ────────────────────────────────────────
  async getTransactionsByPaymentType(groupId: string, paymentType?: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) throw new NotFoundException('Grupo não encontrado');

    const transactions = await this.prisma.transaction.findMany({
      where: {
        groupId,
        ...(paymentType && { paymentType: paymentType as any }),
      },
      orderBy: { data: 'desc' },
      include: {
        user: { select: { id: true, nome: true, email: true } },
      },
    });

    const transactionsWithNumbers = transactions.map((t) => ({
      ...t,
      valor: Number(t.valor),
    }));

    const totalsByPaymentType = transactionsWithNumbers.reduce(
      (acc, t) => {
        const type = t.paymentType || 'NAO_INFORMADO';
        if (!acc[type]) acc[type] = { entradas: 0, saidas: 0, total: 0 };

        if (t.type === 'ENTRADA') {
          acc[type].entradas += t.valor;
          acc[type].total += t.valor;
        } else {
          acc[type].saidas += t.valor;
          acc[type].total -= t.valor;
        }

        return acc;
      },
      {} as Record<string, { entradas: number; saidas: number; total: number }>,
    );

    return {
      transactions: transactionsWithNumbers,
      totalsByPaymentType,
      totalGeral: transactionsWithNumbers.reduce(
        (sum, t) => sum + (t.type === 'ENTRADA' ? t.valor : -t.valor),
        0,
      ),
    };
  }
}
