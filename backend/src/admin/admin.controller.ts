// admin.controller.ts
import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AuthGuard } from 'src/auth/auth.guard'; // ← Corrigido o caminho
import type { Request } from 'express';
import { User } from '@prisma/client';

interface RequestWithUser extends Request {
  user: User;
}

@UseGuards(AuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // Criar organização com admin
  @Post('/create-organization')
  async create(
    @Body() body: CreateOrganizationDto,
    @Req() req: RequestWithUser,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('user nao autenticado');
    }
    const currentUserId = req.user.id;
    return this.adminService.createOrganizationWithAdmin(body, currentUserId);
  }

  // ✅ NOVO: Listar todas organizações (apenas SUPER_ADMIN)
  @Get('/organizations')
  async findAllOrganizations(@Req() req: RequestWithUser) {
    const currentUserId = req.user?.id;
    return this.adminService.findAllOrganizations(currentUserId);
  }

  // ✅ NOVO: Buscar organização por ID
  @Get('/organizations/:id')
  async findOneOrganization(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    const currentUserId = req.user?.id;
    return this.adminService.findOneOrganization(id, currentUserId);
  }

  // ✅ NOVO: Buscar minha organização (para ADMINS)
  @Get('/my-organization')
  async findMyOrganization(@Req() req: RequestWithUser) {
    const currentUserId = req.user?.id;
    return this.adminService.findMyOrganization(currentUserId);
  }

  @Get('/organizations/:id/balances')
  async getOrganizationWithBalance(
    @Param('id') id: string,
    @Req() request: RequestWithUser,
  ) {
    const currentUserId = request.user?.id;
    if (!currentUserId) {
      throw new UnauthorizedException('Usuário não autenticado');
    }
    return this.adminService.getOrganizationWithBalance(id);
  }

  // ✅ NOVA ROTA: Buscar minha organização com saldos
  @Get('/my-organization/balances')
  async getMyOrganizationWithBalance(@Req() request: RequestWithUser) {
    const currentUserId = request.user?.id;
    if (!currentUserId) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    const myOrg = await this.adminService.findMyOrganization(currentUserId);
    return this.adminService.getOrganizationWithBalance(myOrg.id);
  }
}
