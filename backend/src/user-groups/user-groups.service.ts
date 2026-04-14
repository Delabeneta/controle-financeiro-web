import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { GroupPermission, Role } from '@prisma/client';

@Injectable()
export class UserGroupsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserGroupDto, currentUserId: string) {
    // 1. Buscar usuário atual (quem está fazendo a ação)
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, role: true, organizationId: true },
    });

    if (!currentUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // 2. Buscar o grupo
    const group = await this.prisma.group.findUnique({
      where: { id: data.groupId },
      include: { organization: true },
    });

    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    // 3. VERIFICAR PERMISSÃO para adicionar membro
    let canAddMember = false;

    // SUPER_ADMIN pode adicionar qualquer um em qualquer grupo
    if (currentUser.role === Role.SUPER_ADMIN) {
      canAddMember = true;
    }
    // ADMIN pode adicionar membros em grupos da sua organização
    else if (currentUser.role === Role.ADMIN) {
      if (group.organizationId === currentUser.organizationId) {
        canAddMember = true;
      } else {
        throw new ForbiddenException(
          'Você só pode adicionar membros em grupos da sua organização',
        );
      }
    }
    // LÍDER pode adicionar membros APENAS se for EDITOR do grupo
    else if (currentUser.role === Role.LIDER) {
      const userGroup = await this.prisma.userGroup.findUnique({
        where: {
          userId_groupId: { userId: currentUser.id, groupId: data.groupId },
        },
      });

      if (userGroup && userGroup.permission === 'EDITOR') {
        canAddMember = true;
      } else {
        throw new ForbiddenException(
          'Você precisa ser EDITOR do grupo para adicionar membros',
        );
      }
    }

    if (!canAddMember) {
      throw new ForbiddenException(
        'Você não tem permissão para adicionar membros a este grupo',
      );
    }

    // 4. Buscar o usuário a ser adicionado
    const userToAdd = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true, role: true, organizationId: true },
    });

    if (!userToAdd) {
      throw new NotFoundException('Usuário a ser adicionado não encontrado');
    }

    // 5. Verificar se o usuário pertence à mesma organização (exceto SUPER_ADMIN)
    if (currentUser.role !== Role.SUPER_ADMIN) {
      if (userToAdd.organizationId !== group.organizationId) {
        throw new ForbiddenException(
          'O usuário pertence a uma organização diferente',
        );
      }
    }

    // 6. Verificar se já está no grupo
    const exists = await this.prisma.userGroup.findUnique({
      where: {
        userId_groupId: { userId: data.userId, groupId: data.groupId },
      },
    });

    if (exists) {
      throw new ConflictException('Usuário já está neste grupo');
    }

    // 7. Definir permissão
    let permission: GroupPermission = data.permission || 'READ_ONLY';

    // Se o usuário a ser adicionado é LÍDER, pode dar EDITOR automaticamente (opcional)
    if (userToAdd.role === Role.LIDER && !data.permission) {
      permission = 'EDITOR';
    }

    // 8. Criar associação
    return this.prisma.userGroup.create({
      data: {
        userId: data.userId,
        groupId: data.groupId,
        permission: permission,
        createdBy: currentUserId,
      },
      include: {
        user: { select: { id: true, nome: true, email: true, role: true } },
        group: { select: { id: true, nome: true } },
      },
    });
  }

  async findByGroup(groupId: string) {
    return this.prisma.userGroup.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, nome: true, email: true, role: true } },
      },
    });
  }

  async remove(userId: string, groupId: string) {
    const exists = await this.prisma.userGroup.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!exists) throw new NotFoundException('Associação não encontrada');

    return this.prisma.userGroup.delete({
      where: { userId_groupId: { userId, groupId } },
    });
  }
}
