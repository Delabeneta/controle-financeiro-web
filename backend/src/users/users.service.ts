import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { HashingService } from 'src/auth/hashing/hashing.service';
import { GroupsService } from 'src/groups/groups.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private readonly hashingService: HashingService,
    private readonly groupsService: GroupsService,
  ) {}

  async create(data: CreateUserDto) {
    const emailExists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (emailExists) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const passwordHash = await this.hashingService.hash(data.senha);

    const user = await this.prisma.user.create({
      data: {
        nome: data.nome,
        email: data.email,
        senha: passwordHash,
        organizationId: data.organizationId,
        role: data.role || 'LIDER', // deixar assim, de inicio.
      },
      /*select: {
        id: true,
        nome: true,
        email: true,
        organizationId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },*/
    });
    return user;
  }

  async createAdmin(data: CreateUserDto) {
    const emailExists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (emailExists) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const passwordHash = await this.hashingService.hash(data.senha);

    const user = await this.prisma.user.create({
      data: {
        nome: data.nome,
        email: data.email,
        senha: passwordHash,
        organizationId: data.organizationId,
        role: 'SUPER_ADMIN', // Força SUPER_ADMIN
      },
    });
    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    return user;
  }

  async update(id: string, data: UpdateUserDto) {
    await this.findOne(id); // valida se existe

    const updateData: any = {};

    if (data.nome) updateData.nome = data.nome;
    if (data.email) updateData.email = data.email;
    // Se tiver senha, fazer hash
    if (data.senha) {
      updateData.senha = await this.hashingService.hash(data.senha);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // valida se existe

    return this.prisma.user.delete({ where: { id } });
  }

  async getUserGroups(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nome: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const userGroups = await this.prisma.userGroup.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            organization: {
              select: { id: true, nome: true },
            },
            _count: {
              select: { users: true, transactions: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Formatar a resposta com saldos calculados
    const groups = await Promise.all(
      userGroups.map(async (ug) => {
        // ✅ Usar o GroupsService injetado
        const saldos = await this.groupsService.calcularSaldosDoGrupo(
          ug.group.id,
        );

        return {
          id: ug.group.id,
          nome: ug.group.nome,
          organizationId: ug.group.organizationId,
          organization: ug.group.organization,
          permission: ug.permission,
          joinedAt: ug.createdAt,
          membersCount: ug.group._count.users,
          transactionsCount: ug.group._count.transactions,
          saldoInicial: saldos.saldoInicial,
          saldoTotal: saldos.saldoTotal,
          saldoBanco: saldos.saldoBanco,
          saldoCaixa: saldos.saldoCaixa,
        };
      }),
    );

    return {
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
      },
      totalGroups: groups.length,
      groups,
    };
  }
}
