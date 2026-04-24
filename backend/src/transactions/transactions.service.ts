// src/transactions/transactions.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PaymentType, Role, TransactionType, User } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  // ─── CRIAR TRANSAÇÃO ──────────────────────────────────────────────────────────
  async create(data: CreateTransactionDto, user: User) {
    if (!data.groupId) {
      throw new BadRequestException('groupId é obrigatório');
    }

    const group = await this.prisma.group.findUnique({
      where: { id: data.groupId },
      include: { organization: true },
    });

    if (!group) throw new NotFoundException('Grupo não encontrado');

    const dataHora = data.data ? new Date(data.data) : new Date();

    // SUPER_ADMIN — acesso total
    if (user.role === Role.SUPER_ADMIN) {
      return this.createTransaction(data, user.id, dataHora);
    }

    // ADMIN — só grupos da sua organização
    if (user.role === Role.ADMIN) {
      if (group.organizationId !== user.organizationId) {
        throw new ForbiddenException(
          'Você só pode criar transações em grupos da sua organização',
        );
      }
      return this.createTransaction(data, user.id, dataHora);
    }

    // LIDER — precisa ser EDITOR do grupo
    if (user.role === Role.LIDER) {
      const userGroup = await this.prisma.userGroup.findUnique({
        where: {
          userId_groupId: { userId: user.id, groupId: data.groupId },
        },
      });

      if (!userGroup) {
        throw new ForbiddenException('Você não pertence a este grupo');
      }

      if (userGroup.permission !== 'EDITOR') {
        throw new ForbiddenException(
          'Você não tem permissão para criar transações neste grupo',
        );
      }

      return this.createTransaction(data, user.id, dataHora);
    }

    throw new ForbiddenException('Sem permissão para criar transação');
  }

  // ─── HELPER: CRIAR TRANSAÇÃO NO BANCO ────────────────────────────────────────
  private createTransaction(
    data: CreateTransactionDto,
    userId: string,
    dataHora: Date,
  ) {
    return this.prisma.transaction.create({
      data: {
        type: data.tipo,
        valor: data.valor,
        descricao: data.descricao,
        paymentType: data.paymentType,
        data: dataHora,
        groupId: data.groupId,
        createdBy: userId,
      },
      include: {
        group: { select: { id: true, nome: true } },
        user: { select: { id: true, nome: true } },
      },
    });
  }

  // ─── BUSCAR UMA TRANSAÇÃO ─────────────────────────────────────────────────────
  async findOne(id: string, user: User) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        group: true,
        user: { select: { id: true, nome: true } },
      },
    });

    if (!transaction) throw new NotFoundException('Transação não encontrada');

    if (user.role === Role.SUPER_ADMIN) return transaction;

    if (user.role === Role.ADMIN) {
      if (transaction.group.organizationId !== user.organizationId) {
        throw new ForbiddenException('Sem permissão');
      }
      return transaction;
    }

    if (user.role === Role.LIDER) {
      const userGroup = await this.prisma.userGroup.findUnique({
        where: {
          userId_groupId: { userId: user.id, groupId: transaction.groupId },
        },
      });
      if (!userGroup) throw new ForbiddenException('Sem permissão');
      return transaction;
    }

    throw new ForbiddenException('Sem permissão');
  }

  // ─── EDITAR TRANSAÇÃO ─────────────────────────────────────────────────────────
  // Recebe o User completo — sem query extra ao banco
  async update(id: string, data: UpdateTransactionDto, user: User) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: { group: { include: { organization: true } } },
    });

    if (!transaction) throw new NotFoundException('Transação não encontrada');

    if (user.role === Role.SUPER_ADMIN) {
      return this.updateTransaction(id, data);
    }

    if (user.role === Role.ADMIN) {
      if (transaction.group.organizationId !== user.organizationId) {
        throw new ForbiddenException(
          'Você só pode editar transações da sua organização',
        );
      }
      return this.updateTransaction(id, data);
    }

    // LIDER: edição desabilitada por ora
    throw new ForbiddenException('Sem permissão para editar esta transação');
  }

  // ─── HELPER: ATUALIZAR TRANSAÇÃO NO BANCO ────────────────────────────────────
  private updateTransaction(id: string, data: UpdateTransactionDto) {
    return this.prisma.transaction.update({
      where: { id },
      data: {
        descricao: data.descricao,
        valor: data.valor,
        paymentType: data.paymentType,
        type: data.tipo,
        data: data.data ? new Date(data.data) : undefined,
      },
      include: {
        group: { select: { id: true, nome: true } },
        user: { select: { id: true, nome: true } },
      },
    });
  }

  // ─── DELETAR TRANSAÇÃO ────────────────────────────────────────────────────────
  // Recebe o User completo — sem query extra ao banco
  async delete(id: string, user: User) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: { group: { include: { organization: true } } },
    });

    if (!transaction) throw new NotFoundException('Transação não encontrada');

    if (user.role === Role.SUPER_ADMIN) {
      return this.prisma.transaction.delete({ where: { id } });
    }

    if (user.role === Role.ADMIN) {
      if (transaction.group.organizationId !== user.organizationId) {
        throw new ForbiddenException(
          'Você só pode deletar transações da sua organização',
        );
      }
      return this.prisma.transaction.delete({ where: { id } });
    }

    if (user.role === Role.LIDER) {
      const userGroup = await this.prisma.userGroup.findUnique({
        where: {
          userId_groupId: { userId: user.id, groupId: transaction.groupId },
        },
      });

      if (!userGroup)
        throw new ForbiddenException('Você não pertence a este grupo');

      if (userGroup.permission !== 'EDITOR') {
        throw new ForbiddenException(
          'Você não tem permissão para deletar transações neste grupo',
        );
      }

      return this.prisma.transaction.delete({ where: { id } });
    }

    throw new ForbiddenException('Sem permissão para deletar esta transação');
  }

  // ─── LISTAR TODAS ─────────────────────────────────────────────────────────────
  async findAll(user: User) {
    if (user.role === Role.SUPER_ADMIN) {
      return this.prisma.transaction.findMany({
        include: {
          group: { include: { organization: true } },
          user: { select: { id: true, nome: true } },
        },
        orderBy: { data: 'desc' },
      });
    }

    if (user.role === Role.ADMIN) {
      return this.prisma.transaction.findMany({
        where: { group: { organizationId: user.organizationId! } },
        include: {
          group: { include: { organization: true } },
          user: { select: { id: true, nome: true } },
        },
        orderBy: { data: 'desc' },
      });
    }

    // LIDER — só grupos que participa
    return this.prisma.transaction.findMany({
      where: { group: { users: { some: { userId: user.id } } } },
      include: {
        group: { select: { id: true, nome: true } },
        user: { select: { id: true, nome: true } },
      },
      orderBy: { data: 'desc' },
    });
  }

  // ─── LISTAR COM FILTROS ───────────────────────────────────────────────────────
  async findAllWithFilters(
    filters: {
      type?: TransactionType;
      paymentType?: PaymentType;
      groupId?: string;
    },
    user: User,
  ) {
    const where: {
      type?: TransactionType;
      paymentType?: PaymentType;
      groupId?: string;
      group?: object;
    } = {};

    if (filters.type) where.type = filters.type;
    if (filters.paymentType) where.paymentType = filters.paymentType;
    if (filters.groupId) where.groupId = filters.groupId;

    // Escopo por role
    if (user.role === Role.ADMIN) {
      where.group = { organizationId: user.organizationId };
    } else if (user.role === Role.LIDER) {
      where.group = { users: { some: { userId: user.id } } };
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        group: { select: { id: true, nome: true } },
        user: { select: { id: true, nome: true } },
      },
      orderBy: { data: 'desc' },
    });

    // Calcular totais
    const totals = {
      totalGeral: 0,
      totalPix: 0,
      totalDinheiro: 0,
      totalCartao: 0,
      totalTransferencia: 0,
    };

    for (const t of transactions) {
      const valor = t.type === 'ENTRADA' ? Number(t.valor) : -Number(t.valor);
      totals.totalGeral += valor;

      switch (t.paymentType) {
        case 'PIX':
          totals.totalPix += valor;
          break;
        case 'DINHEIRO':
          totals.totalDinheiro += valor;
          break;
        case 'CARTAO_CREDITO':
        case 'CARTAO_DEBITO':
          totals.totalCartao += valor;
          break;
        case 'TRANSFERENCIA':
          totals.totalTransferencia += valor;
          break;
      }
    }

    return {
      transactions: transactions.map((t) => ({ ...t, valor: Number(t.valor) })),
      totals,
    };
  }

  // ─── LISTAR POR GRUPO ─────────────────────────────────────────────────────────
  async findByGroup(groupId: string, type?: 'ENTRADA' | 'SAIDA', user?: User) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) throw new NotFoundException('Grupo não encontrado');

    if (user?.role === Role.ADMIN) {
      if (group.organizationId !== user.organizationId) {
        throw new ForbiddenException(
          'Este grupo não pertence à sua organização',
        );
      }
    }

    if (user?.role === Role.LIDER) {
      const userGroup = await this.prisma.userGroup.findUnique({
        where: {
          userId_groupId: { userId: user.id, groupId },
        },
      });
      if (!userGroup)
        throw new ForbiddenException('Você não pertence a este grupo');
    }

    return this.prisma.transaction.findMany({
      where: { groupId, ...(type ? { type } : {}) },
      include: { user: { select: { id: true, nome: true } } },
      orderBy: { data: 'desc' },
    });
  }
}
