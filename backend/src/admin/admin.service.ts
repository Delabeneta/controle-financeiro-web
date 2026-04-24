// src/admin/admin.service.ts
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { HashingService } from 'src/auth/hashing/hashing.service';
import { Role, User } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private hashingService: HashingService,
  ) {}

  // ─── HELPER PRIVADO ───────────────────────────────────────────────────────────
  // Busca o admin de uma organização — evita repetir a mesma query em vários métodos
  private async findOrgAdmin(organizationId: string) {
    return this.prisma.user.findFirst({
      where: { organizationId, role: Role.ADMIN },
      select: { id: true, nome: true, email: true, role: true },
    });
  }

  // ─── CRIAR ORGANIZAÇÃO COM ADMIN ──────────────────────────────────────────────
  async createOrganizationWithAdmin(
    data: CreateOrganizationDto,
    currentUserId: string,
  ) {
    const { organizationNome, adminNome, adminEmail, adminSenha } = data;

    // Valida email e nome da org em paralelo — evita duas queries sequenciais
    const [existingUser, existingOrg] = await Promise.all([
      this.prisma.user.findUnique({ where: { email: adminEmail } }),
      this.prisma.organization.findFirst({
        where: { nome: organizationNome, deletedAt: null },
      }),
    ]);

    if (existingUser) throw new BadRequestException('E-mail já cadastrado');
    if (existingOrg)
      throw new BadRequestException('Organização com este nome já existe');

    // Cria org e admin numa transação — se um falhar, nenhum é salvo
    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          nome: organizationNome,
          createdById: currentUserId,
        },
      });

      const senhaHash = await this.hashingService.hash(adminSenha);

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

  // ─── LISTAR TODAS AS ORGANIZAÇÕES ─────────────────────────────────────────────
  // Verificação de role feita no controller — service só executa a query
  async findAllOrganizations() {
    const organizations = await this.prisma.organization.findMany({
      where: { deletedAt: null },
      include: {
        _count: { select: { groups: true, users: true } },
      },
      orderBy: { nome: 'asc' },
    });

    // Busca os admins de todas as orgs em paralelo
    return Promise.all(
      organizations.map(async (org) => ({
        ...org,
        admin: await this.findOrgAdmin(org.id),
      })),
    );
  }

  // ─── BUSCAR ORGANIZAÇÃO POR ID ────────────────────────────────────────────────
  // Recebe o User completo — evita query extra ao banco só para checar o role
  async findOneOrganization(id: string, requester: User) {
    // ADMIN só pode ver a própria organização
    if (requester.role === Role.ADMIN && requester.organizationId !== id) {
      throw new ForbiddenException(
        'Você só pode acessar sua própria organização',
      );
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        groups: {
          include: {
            _count: { select: { users: true, transactions: true } },
          },
        },
        users: {
          select: { id: true, nome: true, email: true, role: true },
          orderBy: { nome: 'asc' },
        },
        _count: { select: { groups: true, users: true } },
      },
    });

    if (!organization)
      throw new NotFoundException('Organização não encontrada');

    return {
      ...organization,
      admin: await this.findOrgAdmin(id),
    };
  }

  // ─── CALCULAR SALDO DA ORGANIZAÇÃO ───────────────────────────────────────────
  async calcularSaldoDaOrganizacao(organizationId: string) {
    const groups = await this.prisma.group.findMany({
      where: { organizationId },
      include: { transactions: true },
    });

    let saldoTotal = 0;
    let saldoBancoTotal = 0;
    let saldoCaixaTotal = 0;

    const tiposBanco = [
      'PIX',
      'CARTAO_CREDITO',
      'CARTAO_DEBITO',
      'TRANSFERENCIA',
    ];

    for (const group of groups) {
      const saldoInicial = group.saldoInicial ? Number(group.saldoInicial) : 0;
      let totalEntradas = 0;
      let totalSaidas = 0;
      let saldoBanco = 0;
      let saldoCaixa = 0;

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

      saldoTotal += saldoInicial + totalEntradas - totalSaidas;
      saldoBancoTotal += saldoBanco;
      saldoCaixaTotal += saldoCaixa;
    }

    return { saldoTotal, saldoBancoTotal, saldoCaixaTotal };
  }

  // ─── BUSCAR ORGANIZAÇÃO COM SALDO ─────────────────────────────────────────────
  async getOrganizationWithBalance(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        groups: {
          include: {
            transactions: true,
            _count: { select: { users: true } },
          },
        },
        users: true,
      },
    });

    if (!organization)
      throw new NotFoundException('Organização não encontrada');

    const saldo = await this.calcularSaldoDaOrganizacao(organizationId);

    return { ...organization, saldo };
  }
}
