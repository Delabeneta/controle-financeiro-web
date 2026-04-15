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

  // ==================== CREATE ====================
  async create(data: CreateTransactionDto, userId: string) {
    console.log('userId recebido:', userId);

    if (!data.groupId) {
      throw new BadRequestException('groupId é obrigatório');
    }

    // Buscar usuário com suas permissões
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, organizationId: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Buscar grupo
    const group = await this.prisma.group.findUnique({
      where: { id: data.groupId },
      include: { organization: true },
    });

    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    // 🔹 SUPER_ADMIN: pode criar em qualquer grupo (qualquer organização)
    if (user.role === Role.SUPER_ADMIN) {
      return this.createTransaction(data, userId);
    }

    // 🔹 ADMIN: só pode criar em grupos da sua organização
    if (user.role === Role.ADMIN) {
      if (group.organizationId !== user.organizationId) {
        throw new ForbiddenException(
          'Você só pode criar transações em grupos da sua organização',
        );
      }
      return this.createTransaction(data, userId);
    }

    // 🔹 LIDER: só pode criar se for EDITOR do grupo
    if (user.role === Role.LIDER) {
      const userGroup = await this.prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId: userId,
            groupId: data.groupId,
          },
        },
      });

      if (!userGroup) {
        throw new ForbiddenException('Você não pertence a este grupo');
      }

      if (userGroup.permission !== 'EDITOR') {
        throw new ForbiddenException(
          'Você não tem permissão para criar transações neste grupo (apenas leitura)',
        );
      }

      return this.createTransaction(data, userId);
    }

    throw new ForbiddenException('Sem permissão para criar transação');
  }

  // Método auxiliar para criar transação
  private async createTransaction(data: CreateTransactionDto, userId: string) {
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
        user: { select: { id: true, nome: true } },
      },
    });
  }

  async findOne(id: string, user: User) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        group: true,
        user: { select: { id: true, nome: true } },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    // Verificar permissão
    if (user.role === Role.SUPER_ADMIN) {
      return transaction;
    }

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
      if (!userGroup) {
        throw new ForbiddenException('Sem permissão');
      }
      return transaction;
    }

    throw new ForbiddenException('Sem permissão');
  }
  // ==================== UPDATE ====================
  async update(id: string, data: UpdateTransactionDto, userId: string) {
    // Buscar usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, organizationId: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Buscar transação com grupo
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        group: {
          include: { organization: true },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    // 🔹 SUPER_ADMIN: pode editar qualquer transação (qualquer organização)
    if (user.role === Role.SUPER_ADMIN) {
      return this.updateTransaction(id, data);
    }

    // 🔹 ADMIN: só pode editar transações de grupos da sua organização
    if (user.role === Role.ADMIN) {
      if (transaction.group.organizationId !== user.organizationId) {
        throw new ForbiddenException(
          'Você só pode editar transações da sua organização',
        );
      }
      return this.updateTransaction(id, data);
    }

    /* 🔹 LIDER: só pode editar se for EDITOR do grupo
    if (user.role === Role.LIDER) {
      const userGroup = await this.prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId: userId,
            groupId: transaction.groupId,
          },
        },
      });

      if (!userGroup) {
        throw new ForbiddenException('Você não pertence a este grupo');
      }

      if (userGroup.permission !== 'EDITOR') {
        throw new ForbiddenException(
          'Você não tem permissão para editar transações neste grupo (apenas leitura)',
        );
      }

      return this.updateTransaction(id, data);
    } */

    throw new ForbiddenException('Sem permissão para editar esta transação');
  }

  // Método auxiliar para atualizar transação
  private async updateTransaction(id: string, data: UpdateTransactionDto) {
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

  // ==================== DELETE ====================
  async delete(id: string, userId: string) {
    // Buscar usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, organizationId: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Buscar transação com grupo
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        group: {
          include: { organization: true },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    // 🔹 SUPER_ADMIN: pode deletar qualquer transação
    if (user.role === Role.SUPER_ADMIN) {
      return this.prisma.transaction.delete({ where: { id } });
    }

    // 🔹 ADMIN: só pode deletar transações da sua organização
    if (user.role === Role.ADMIN) {
      if (transaction.group.organizationId !== user.organizationId) {
        throw new ForbiddenException(
          'Você só pode deletar transações da sua organização',
        );
      }
      return this.prisma.transaction.delete({ where: { id } });
    }

    // 🔹 LIDER: só pode deletar se for EDITOR do grupo
    if (user.role === Role.LIDER) {
      const userGroup = await this.prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId: userId,
            groupId: transaction.groupId,
          },
        },
      });

      if (!userGroup) {
        throw new ForbiddenException('Você não pertence a este grupo');
      }

      if (userGroup.permission !== 'EDITOR') {
        throw new ForbiddenException(
          'Você não tem permissão para deletar transações neste grupo (apenas leitura)',
        );
      }

      return this.prisma.transaction.delete({ where: { id } });
    }

    throw new ForbiddenException('Sem permissão para deletar esta transação');
  }

  // ==================== FIND ALL ====================
  async findAll(user: {
    id: string;
    role: Role;
    organizationId: string | null;
  }) {
    // 🔹 SUPER_ADMIN: todas as transações
    if (user.role === Role.SUPER_ADMIN) {
      return this.prisma.transaction.findMany({
        include: {
          group: { include: { organization: true } },
          user: { select: { id: true, nome: true } },
        },
        orderBy: { data: 'desc' },
      });
    }

    // 🔹 ADMIN: todas as transações dos grupos da sua organização
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

    // 🔹 LIDER: só transações dos grupos que ele participa
    return this.prisma.transaction.findMany({
      where: {
        group: {
          users: { some: { userId: user.id } },
        },
      },
      include: {
        group: { select: { id: true, nome: true } },
        user: { select: { id: true, nome: true } },
      },
      orderBy: { data: 'desc' },
    });
  }

  // ==================== FIND WITH FILTERS ====================
  async findAllWithFilters(filters: any, user: User) {
    const where: any = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.paymentType) {
      where.paymentType = filters.paymentType;
    }

    if (filters.groupId) {
      where.groupId = filters.groupId;
    }

    // Permissões do usuário
    if (user.role === Role.ADMIN) {
      where.group = { organizationId: user.organizationId };
    } else if (user.role === Role.LIDER) {
      where.group = {
        users: { some: { userId: user.id } },
      };
    }
    // SUPER_ADMIN: sem filtro de organização

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

  // ==================== FIND BY GROUP ====================
  async findByGroup(groupId: string, type?: 'ENTRADA' | 'SAIDA', user?: User) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    // Se for LÍDER, verificar se pertence ao grupo
    if (user?.role === Role.LIDER) {
      const userGroup = await this.prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId: user.id,
            groupId: groupId,
          },
        },
      });

      if (!userGroup) {
        throw new ForbiddenException('Você não pertence a este grupo');
      }
    }

    // Se for ADMIN, verificar se o grupo é da sua organização
    if (user?.role === Role.ADMIN) {
      if (group.organizationId !== user.organizationId) {
        throw new ForbiddenException(
          'Este grupo não pertence à sua organização',
        );
      }
    }

    const where: any = { groupId };
    if (type) {
      where.type = type;
    }

    return this.prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: { id: true, nome: true },
        },
      },
      orderBy: { data: 'desc' },
    });
  }
}
