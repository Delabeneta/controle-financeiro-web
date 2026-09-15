/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/prestacao-contas/prestacao-contas.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePrestacaoContasDto } from './dto/update-prestacao-conta.dto';
import { Role, User } from '@prisma/client';

@Injectable()
export class PrestacaoContasService {
  constructor(private prisma: PrismaService) {}

  // ─── LISTAR STATUS DE UM MÊS/ANO (escopado por role) ─────────────────────────
  // Grupo sem registro pra esse mês/ano é tratado como PENDENTE — não
  // precisamos pré-criar uma linha por grupo/mês.
  async findAll(mes: number, ano: number, user: User) {
    if (!mes || !ano || mes < 1 || mes > 12) {
      throw new BadRequestException('mes (1-12) e ano são obrigatórios');
    }

    let groupWhere: { organizationId?: string; users?: object } = {};

    if (user.role === Role.ADMIN) {
      groupWhere = { organizationId: user.organizationId! };
    } else if (user.role === Role.LIDER) {
      groupWhere = { users: { some: { userId: user.id } } };
    }
    // SUPER_ADMIN: sem restrição

    const groups = await this.prisma.group.findMany({
      where: groupWhere,
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    });

    const groupIds = groups.map((g) => g.id);

    const registros = await this.prisma.prestacaoContas.findMany({
      where: { groupId: { in: groupIds }, mes, ano },
      include: { updatedByUser: { select: { id: true, nome: true } } },
    });

    const registrosPorGrupo = new Map(registros.map((r) => [r.groupId, r]));

    return groups.map((g) => {
      const registro = registrosPorGrupo.get(g.id);
      return {
        groupId: g.id,
        groupName: g.nome,
        mes,
        ano,
        status: registro?.status ?? 'PENDENTE',
        updatedByName: registro?.updatedByUser?.nome ?? null,
        updatedAt: registro?.updatedAt ?? null,
      };
    });
  }

  // ─── ALTERAR STATUS (apenas ADMIN/SUPER_ADMIN) ───────────────────────────────
  async update(dto: UpdatePrestacaoContasDto, user: User) {
    if (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores e coordenadores podem alterar o status da prestação de contas',
      );
    }

    const group = await this.prisma.group.findUnique({
      where: { id: dto.groupId },
    });

    if (!group) throw new NotFoundException('Grupo não encontrado');

    if (
      user.role === Role.ADMIN &&
      group.organizationId !== user.organizationId
    ) {
      throw new ForbiddenException(
        'Você só pode alterar a prestação de contas de grupos da sua organização',
      );
    }

    return this.prisma.prestacaoContas.upsert({
      where: {
        groupId_mes_ano: { groupId: dto.groupId, mes: dto.mes, ano: dto.ano },
      },
      update: { status: dto.status, updatedBy: user.id },
      create: {
        groupId: dto.groupId,
        mes: dto.mes,
        ano: dto.ano,
        status: dto.status,
        updatedBy: user.id,
      },
      include: { updatedByUser: { select: { id: true, nome: true } } },
    });
  }
}
