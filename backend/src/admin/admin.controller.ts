// src/admin/admin.controller.ts
import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import type { Request } from 'express';
import { Role, User } from '@prisma/client';

interface RequestWithUser extends Request {
  user: User;
}

// Helper para checar roles — evita repetir if/throw em cada método
function requireRole(user: User, ...roles: Role[]) {
  if (!roles.includes(user.role)) {
    throw new ForbiddenException('Você não tem permissão para esta ação');
  }
}

@UseGuards(AuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ─── CRIAR ORGANIZAÇÃO ────────────────────────────────────────────────────────
  // Apenas SUPER_ADMIN pode criar organizações
  @Post('/create-organization')
  create(@Body() body: CreateOrganizationDto, @Req() req: RequestWithUser) {
    requireRole(req.user, Role.SUPER_ADMIN);
    return this.adminService.createOrganizationWithAdmin(body, req.user.id);
  }

  // ─── LISTAR TODAS AS ORGANIZAÇÕES ────────────────────────────────────────────
  // Apenas SUPER_ADMIN pode listar todas
  @Get('/organizations')
  findAllOrganizations(@Req() req: RequestWithUser) {
    requireRole(req.user, Role.SUPER_ADMIN);
    return this.adminService.findAllOrganizations();
  }

  // ─── BUSCAR ORGANIZAÇÃO POR ID ────────────────────────────────────────────────
  // SUPER_ADMIN vê qualquer uma, ADMIN só vê a sua
  @Get('/organizations/:id')
  findOneOrganization(@Param('id') id: string, @Req() req: RequestWithUser) {
    requireRole(req.user, Role.SUPER_ADMIN, Role.ADMIN);
    return this.adminService.findOneOrganization(id, req.user);
  }

  // ─── MINHA ORGANIZAÇÃO ────────────────────────────────────────────────────────
  // ADMIN busca a própria organização sem precisar informar o ID
  @Get('/my-organization')
  findMyOrganization(@Req() req: RequestWithUser) {
    requireRole(req.user, Role.ADMIN);

    if (!req.user.organizationId) {
      throw new ForbiddenException('Você não está vinculado a uma organização');
    }

    return this.adminService.findOneOrganization(
      req.user.organizationId,
      req.user,
    );
  }

  // ─── SALDO DE UMA ORGANIZAÇÃO ─────────────────────────────────────────────────
  // SUPER_ADMIN vê qualquer uma, ADMIN só vê a sua
  @Get('/organizations/:id/balances')
  getOrganizationBalance(@Param('id') id: string, @Req() req: RequestWithUser) {
    requireRole(req.user, Role.SUPER_ADMIN, Role.ADMIN);

    if (req.user.role === Role.ADMIN && req.user.organizationId !== id) {
      throw new ForbiddenException(
        'Você só pode ver o saldo da sua organização',
      );
    }

    return this.adminService.calcularSaldoDaOrganizacao(id);
  }

  // ─── SALDO DA MINHA ORGANIZAÇÃO ───────────────────────────────────────────────
  @Get('/my-organization/balances')
  getMyOrganizationBalance(@Req() req: RequestWithUser) {
    requireRole(req.user, Role.ADMIN);

    if (!req.user.organizationId) {
      throw new ForbiddenException('Você não está vinculado a uma organização');
    }

    return this.adminService.calcularSaldoDaOrganizacao(
      req.user.organizationId,
    );
  }
}
