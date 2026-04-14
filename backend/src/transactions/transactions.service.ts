/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Role, User } from '@prisma/client';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTransactionDto, userId: string) {
    // ← receber userId do token
    console.log('userId recebido:', userId); // ← Debug

    if (!data.groupId) {
      throw new BadRequestException('groupId é obrigatório');
    }

    // Se for admin ou super admin, ele pode criar transações sem estar associado a um grupo
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, organizationId: true },
    });

    if (!user) {
      throw new NotFoundException('user nao encontrado');
    }

    const group = await this.prisma.group.findUnique({
      where: { id: data.groupId },
      include: { organization: true },
    });
    if (!group) throw new NotFoundException('Grupo não encontrado');

    if (user.role != Role.LIDER) {
      if (group.organizationId !== user.organizationId) {
        throw new ForbiddenException('Grupo não pertence a sua organização');
      }

      // Admin/Super Admin têm permissão total
      return this.prisma.transaction.create({
        data: {
          type: data.tipo,
          valor: data.valor,
          descricao: data.descricao,
          paymentType: data.paymentType,
          data: new Date(data.data),
          groupId: data.groupId,
          createdBy: userId,
        },
        include: {
          group: { select: { id: true, nome: true } },
          user: {
            select: { id: true, nome: true },
          },
        },
      });
    }

    // Verificar se usuário, lider, pertence ao grupo
    const userGroup = await this.prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId: userId,
          groupId: data.groupId,
        },
      },
    });

    if (!userGroup) {
      throw new ForbiddenException('Usuário não pertence a este grupo');
    }

    if (userGroup.permission === 'READ_ONLY') {
      throw new ForbiddenException('Usuário com permissão somente leitura');
    }

    return this.prisma.transaction.create({
      data: {
        type: data.tipo,
        valor: data.valor,
        descricao: data.descricao,
        data: new Date(data.data),
        groupId: data.groupId,
        createdBy: userId, // ← usar 'createdBy' não 'createdById'
        paymentType: data.paymentType,
      },
      include: {
        group: { select: { id: true, nome: true } },
        user: { select: { id: true, nome: true } },
      },
    });
  }

  async update(id: string, data: UpdateTransactionDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, organizationId: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: { group: { include: { organization: true } } },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    // SUPER_ADMIN pode editar qualquer transação
    if (user.role === Role.SUPER_ADMIN) {
      return this.prisma.transaction.update({
        where: { id },
        data: {
          descricao: data.descricao,
          valor: data.valor,
          paymentType: data.paymentType,
          data: data.data ? new Date(data.data) : undefined,
        },
      });
    }

    // ADMIN pode editar transações da sua organização
    if (user.role === Role.ADMIN) {
      if (transaction.group.organizationId !== user.organizationId) {
        throw new ForbiddenException('Você não pode editar esta transação');
      }
      return this.prisma.transaction.update({
        where: { id },
        data: {
          descricao: data.descricao,
          valor: data.valor,
          paymentType: data.paymentType,
          data: data.data ? new Date(data.data) : undefined,
        },
      });
    }

    // LÍDER pode editar apenas se for EDITOR do grupo
    if (user.role === Role.LIDER) {
      const userGroup = await this.prisma.userGroup.findUnique({
        where: {
          userId_groupId: { userId, groupId: transaction.groupId },
        },
      });

      if (!userGroup || userGroup.permission !== 'EDITOR') {
        throw new ForbiddenException(
          'Você não tem permissão para editar esta transação',
        );
      }

      return this.prisma.transaction.update({
        where: { id },
        data: {
          descricao: data.descricao,
          valor: data.valor,
          paymentType: data.paymentType,
          data: data.data ? new Date(data.data) : undefined,
        },
      });
    }

    throw new ForbiddenException('Sem permissão para editar esta transação');
  }

  async findAll(user: {
    id: string;
    role: Role;
    organizationId: string | null;
  }) {
    // Super Admin — todas as transações (implementar se necessário)
    if (user.role === Role.SUPER_ADMIN) {
      return this.prisma.transaction.findMany({
        include: {
          group: { include: { organization: true } },
          user: { select: { id: true, nome: true } },
        },
        orderBy: { data: 'desc' },
      });
    }
    // Admin — todas as transações dos grupos da sua organização
    if (user.role === Role.ADMIN) {
      return this.prisma.transaction.findMany({
        where: {
          group: { organizationId: user.organizationId! },
        },
        include: {
          group: { include: { organization: true } },
          user: { select: { id: true, nome: true } },
        },
        orderBy: { data: 'desc' },
      });
    }

    // Líder — só transações dos grupos que ele participa
    return this.prisma.transaction.findMany({
      where: {
        group: {
          users: { some: { userId: user.id } }, // ← é 'users' não 'userGroups'
        },
      },
      include: {
        group: { select: { id: true, nome: true } },
        user: { select: { id: true, nome: true } },
      },
      orderBy: { data: 'desc' },
    });
  }

  // transactions.service.ts
  async findAllWithFilters(filters: any, user: User) {
    const where: any = {};

    // Filtro por tipo
    if (filters.type) {
      where.type = filters.type;
    }

    // Filtro por tipo de pagamento
    if (filters.paymentType) {
      where.paymentType = filters.paymentType;
    }

    // Filtro por grupo (com verificação de permissão)
    if (filters.groupId) {
      where.groupId = filters.groupId;
    }

    // Permissões do usuário
    if (user.role === 'ADMIN') {
      where.group = { organizationId: user.organizationId };
    } else if (user.role === 'LIDER') {
      where.group = {
        users: { some: { userId: user.id } },
      };
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
      transactions: transactions.map((t) => ({
        ...t,
        valor: Number(t.valor),
      })),
      totals,
    };
  }

  async findByGroup(groupId: string, type?: 'ENTRADA' | 'SAIDA', user?: User) {
    const where: any = { groupId };
    if (type) {
      where.type = type;
    }

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Grupo não encontrado');

    return this.prisma.transaction.findMany({
      where: { groupId },
      include: {
        user: {
          select: { id: true, nome: true },
        },
      },
      orderBy: { data: 'desc' },
    });
  }
}
