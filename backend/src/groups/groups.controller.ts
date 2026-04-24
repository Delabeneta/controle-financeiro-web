// src/groups/groups.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { PaymentType, Role, User } from '@prisma/client';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('groups')
@UseGuards(AuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  // ─── CRIAR GRUPO ──────────────────────────────────────────────────────────────
  @Post()
  create(@Body() body: CreateGroupDto, @Req() req: RequestWithUser) {
    if (req.user.role !== Role.ADMIN && req.user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Apenas administradores podem criar grupos');
    }

    return this.groupsService.create(body, req.user);
  }

  // ─── LISTAR GRUPOS ────────────────────────────────────────────────────────────
  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.groupsService.findAll(req.user);
  }

  // ─── BUSCAR SALDOS DO GRUPO ───────────────────────────────────────────────────
  @Get(':id/saldos')
  async getGroupSaldos(@Param('id') id: string, @Req() req: RequestWithUser) {
    await this.groupsService.findOne(id, req.user);
    return this.groupsService.calcularSaldosDoGrupo(id);
  }

  // ─── BUSCAR GRUPO COM SALDO ───────────────────────────────────────────────────
  @Get(':id/balance')
  async getGroupWithBalance(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    await this.groupsService.findOne(id, req.user); // valida permissão
    return this.groupsService.getGroupWithBalance(id);
  }

  // ─── LISTAR GRUPOS COM SALDOS POR ORGANIZAÇÃO ────────────────────────────────
  @Get('organization/:orgId/balances')
  async listGroupsWithBalances(
    @Param('orgId') orgId: string,
    @Req() req: RequestWithUser,
  ) {
    if (
      req.user.role !== Role.SUPER_ADMIN &&
      req.user.organizationId !== orgId
    ) {
      throw new ForbiddenException('Você não tem acesso a esta organização');
    }

    return this.groupsService.listGroupsWithBalances(orgId);
  }

  // ─── TRANSAÇÕES POR TIPO DE PAGAMENTO ────────────────────────────────────────
  @Get(':id/transactions/payment-type')
  async getTransactionsByPaymentType(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Query('paymentType') paymentType?: PaymentType,
  ) {
    await this.groupsService.findOne(id, req.user); // valida permissão
    return this.groupsService.getTransactionsByPaymentType(id, paymentType);
  }

  // ─── BUSCAR UM GRUPO ──────────────────────────────────────────────────────────
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.groupsService.findOne(id, req.user);
  }
}
