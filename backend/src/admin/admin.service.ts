// admin.service.ts
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // admin.service.ts - Corrigir método calcularSaldoDaOrganizacao
  async calcularSaldoDaOrganizacao(organizationId: string) {
    const groups = await this.prisma.group.findMany({
      where: { organizationId },
      include: {
        transactions: true,
      },
    });

    let saldoTotal = 0;
    let saldoBancoTotal = 0;
    let saldoCaixaTotal = 0;

    for (const group of groups) {
      const saldoInicial = group.saldoInicial ? Number(group.saldoInicial) : 0;
      let totalEntradas = 0;
      let totalSaidas = 0;
      let saldoBanco = 0;
      let saldoCaixa = 0;

      for (const transaction of group.transactions) {
        // ✅ Converter Decimal para Number
        const valor = Number(transaction.valor);
        const isEntrada = transaction.type === 'ENTRADA';

        if (isEntrada) {
          totalEntradas += valor;
        } else {
          totalSaidas += valor;
        }

        // Calcular por tipo de pagamento
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

      saldoTotal += saldoInicial + totalEntradas - totalSaidas;
      saldoBancoTotal += saldoBanco;
      saldoCaixaTotal += saldoCaixa;
    }

    return {
      saldoTotal,
      saldoBancoTotal,
      saldoCaixaTotal,
    };
  }

  // Buscar organização com saldo total
  async getOrganizationWithBalance(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        groups: {
          include: {
            transactions: true,
            _count: {
              select: { users: true },
            },
          },
        },
        users: true,
      },
    });

    if (!organization) throw new Error('Organização não encontrada');

    const saldoTotal = await this.calcularSaldoDaOrganizacao(organizationId);

    return {
      ...organization,
      saldoTotal,
    };
  }

  async createOrganizationWithAdmin(
    data: CreateOrganizationDto,
    currentUserId?: string,
  ) {
    const { organizationNome, adminNome, adminEmail, adminSenha } = data;

    // Verifica se o usuário está autenticado
    if (!currentUserId) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    // Busca o usuário atual
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true },
    });

    // Verifica se é SUPER_ADMIN
    if (!currentUser || currentUser.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Apenas SUPER_ADMIN pode criar organizações',
      );
    }

    // Valida se email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      throw new BadRequestException('Email já cadastrado');
    }

    // Valida se organização com mesmo nome já existe
    const existingOrg = await this.prisma.organization.findFirst({
      where: {
        nome: organizationNome,
        deletedAt: null,
      },
    });

    if (existingOrg) {
      throw new BadRequestException('Organização com este nome já existe');
    }

    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          nome: organizationNome,
        },
      });

      const senhaHash = await bcrypt.hash(adminSenha, 10);

      const admin = await tx.user.create({
        data: {
          nome: adminNome,
          email: adminEmail,
          senha: senhaHash,
          role: Role.ADMIN,
          organizationId: organization.id,
        },
      });

      return {
        organization,
        admin: {
          id: admin.id,
          nome: admin.nome,
          email: admin.email,
          role: admin.role,
        },
      };
    });
  }

  // ✅ NOVO: Listar todas organizações (apenas SUPER_ADMIN)
  async findAllOrganizations(currentUserId?: string) {
    // Verifica se o usuário está autenticado
    if (!currentUserId) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    // Busca o usuário atual
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true },
    });

    // Apenas SUPER_ADMIN pode listar todas organizações
    if (!currentUser || currentUser.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Apenas SUPER_ADMIN pode listar todas organizações',
      );
    }

    const organizations = await this.prisma.organization.findMany({
      include: {
        _count: {
          select: { groups: true, users: true },
        },
      },
      orderBy: { nome: 'asc' },
    });

    // Para cada organização, buscar o admin
    const organizationsWithAdmin = await Promise.all(
      organizations.map(async (org) => {
        const admin = await this.prisma.user.findFirst({
          where: {
            organizationId: org.id,
            role: Role.ADMIN,
          },
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
          },
        });

        return {
          ...org,
          admin: admin || null,
        };
      }),
    );

    return organizationsWithAdmin;
  }

  // ✅ NOVO: Buscar uma organização específica por ID
  async findOneOrganization(id: string, currentUserId?: string) {
    // Verifica se o usuário está autenticado
    if (!currentUserId) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    // Busca o usuário atual
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, role: true, organizationId: true },
    });

    if (!currentUser) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Busca a organização
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        groups: {
          include: {
            _count: { select: { users: true, transactions: true } },
          },
        },
        users: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
          },
          orderBy: { nome: 'asc' },
        },
        _count: {
          select: { groups: true, users: true },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organização não encontrada');
    }

    // Verificar permissão
    // SUPER_ADMIN pode ver qualquer organização
    if (currentUser.role === Role.SUPER_ADMIN) {
      // Buscar o admin da organização
      const admin = await this.prisma.user.findFirst({
        where: {
          organizationId: organization.id,
          role: Role.ADMIN,
        },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
        },
      });

      return {
        ...organization,
        admin: admin || null,
      };
    }

    // ADMIN pode ver apenas sua própria organização
    if (currentUser.role === Role.ADMIN && currentUser.organizationId === id) {
      const admin = await this.prisma.user.findFirst({
        where: {
          organizationId: organization.id,
          role: Role.ADMIN,
        },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
        },
      });

      return {
        ...organization,
        admin: admin || null,
      };
    }

    throw new ForbiddenException(
      'Você não tem permissão para acessar esta organização',
    );
  }

  // ✅ NOVO: Buscar organização do admin logado
  async findMyOrganization(currentUserId?: string) {
    // Verifica se o usuário está autenticado
    if (!currentUserId) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    // Busca o usuário atual
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, role: true, organizationId: true },
    });

    if (!currentUser) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Se for ADMIN, retorna sua organização
    if (currentUser.role === Role.ADMIN && currentUser.organizationId) {
      return this.findOneOrganization(
        currentUser.organizationId,
        currentUserId,
      );
    }

    // Se for SUPER_ADMIN, retorna erro (use findAllOrganizations)
    if (currentUser.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'SUPER_ADMIN deve usar /admin/organizations para listar todas organizações',
      );
    }

    // LÍDER/MEMBRO não têm organização diretamente
    throw new ForbiddenException(
      'Sua role não possui uma organização vinculada',
    );
  }
}
