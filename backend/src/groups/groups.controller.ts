// groups.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { PaymentType, Role, User } from '@prisma/client';

interface RequestWithUser extends Request {
  user?: User;
}

@Controller('groups')
@UseGuards(AuthGuard) // Protege todas as rotas
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@Body() body: CreateGroupDto, @Req() request: RequestWithUser) {
    console.log('Dados recebidos:', body); // ← Adicione este log
    console.log('Usuário:', request.user); // ← Adicione este log
    const currentUser = request.user;

    // Apenas ADMIN ou SUPER admin pode criar grupo
    if (
      currentUser?.role !== Role.ADMIN &&
      currentUser?.role !== Role.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Apenas administradores podem criar grupos');
    }

    return this.groupsService.create(body, currentUser);
  }

  @Get()
  findAll(@Req() request: RequestWithUser) {
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    return this.groupsService.findAll({
      id: user.id,
      role: user.role,
      organizationId: user.organizationId,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: RequestWithUser) {
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Usuario nao autenticado');
    }
    return this.groupsService.findOne(id, {
      id: user.id,
      role: user.role,
      organizationId: user.organizationId,
    });
  }
  // ✅ NOVA ROTA: Buscar grupo com saldo calculado
  @Get(':id/balance')
  async getGroupWithBalance(
    @Param('id') id: string,
    @Req() request: RequestWithUser,
  ) {
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    // Verificar permissão
    const group = await this.groupsService.findOne(id, {
      id: user.id,
      role: user.role,
      organizationId: user.organizationId,
    });

    if (!group) {
      throw new ForbiddenException('Você não tem acesso a este grupo');
    }

    return this.groupsService.getGroupWithBalance(id);
  }

  // ✅ NOVA ROTA: Listar grupos com saldos
  @Get('organization/:orgId/balances')
  async listGroupsWithBalances(
    @Param('orgId') orgId: string,
    @Req() request: RequestWithUser,
  ) {
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    // Verificar permissão
    if (user.role !== Role.SUPER_ADMIN && user.organizationId !== orgId) {
      throw new ForbiddenException('Você não tem acesso a esta organização');
    }

    return this.groupsService.listGroupsWithBalances(orgId);
  }

  // ✅ NOVA ROTA: Atualizar saldo inicial
  @Post(':id/saldo-inicial')
  async updateSaldoInicial(
    @Param('id') id: string,
    @Body('saldoInicial') saldoInicial: number,
    @Req() request: RequestWithUser,
  ) {
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    if (saldoInicial === undefined) {
      throw new ForbiddenException('saldoInicial é obrigatório');
    }

    return this.groupsService.updateSaldoInicial(id, saldoInicial, {
      id: user.id,
      role: user.role,
      organizationId: user.organizationId,
    });
  }

  // ✅ NOVA ROTA: Buscar transações por tipo de pagamento
  @Get(':id/transactions/payment-type')
  async getTransactionsByPaymentType(
    @Param('id') id: string,
    @Req() request: RequestWithUser,
    @Query('paymentType') paymentType?: PaymentType, // ← MUDAR PARA @Query
  ) {
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    // Verificar permissão
    await this.groupsService.findOne(id, {
      id: user.id,
      role: user.role,
      organizationId: user.organizationId,
    });

    return this.groupsService.getTransactionsByPaymentType(id, paymentType);
  }

  // ✅ Adicionar rota para buscar saldos detalhados do grupo
  @Get(':id/saldos')
  async getGroupSaldos(
    @Param('id') id: string,
    @Req() request: RequestWithUser,
  ) {
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    // Verificar permissão
    await this.groupsService.findOne(id, {
      id: user.id,
      role: user.role,
      organizationId: user.organizationId,
    });

    return this.groupsService.calcularSaldosDoGrupo(id);
  }
}
