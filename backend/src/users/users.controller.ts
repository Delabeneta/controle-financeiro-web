// src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { Role, User } from '@prisma/client';

interface RequestWithUser extends Request {
  user: User;
}

@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── CRIAR USUÁRIO ───────────────────────────────────────────────────────────
  // Apenas ADMIN e SUPER_ADMIN podem criar usuários
  @Post()
  create(@Req() req: RequestWithUser, @Body() createUserDto: CreateUserDto) {
    const requester = req.user;

    // Apenas ADMIN e SUPER_ADMIN podem criar usuários
    if (requester.role !== Role.ADMIN && requester.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Sem permissão para criar usuários');
    }

    // ADMIN não pode criar SUPER_ADMIN nem outro ADMIN
    if (requester.role === Role.ADMIN) {
      if (
        createUserDto.role === Role.SUPER_ADMIN ||
        createUserDto.role === Role.ADMIN
      ) {
        throw new ForbiddenException(
          'Administradores só podem criar usuários com role LIDER ou MEMBRO',
        );
      }

      // ADMIN só pode criar usuários na sua própria organização
      if (
        createUserDto.organizationId &&
        createUserDto.organizationId !== requester.organizationId
      ) {
        throw new ForbiddenException(
          'Você só pode criar usuários na sua organização',
        );
      }

      // Garante que o usuário será criado na organização do ADMIN
      createUserDto.organizationId = requester.organizationId ?? undefined;
    }

    // SUPER_ADMIN pode criar qualquer role, mas precisa informar organizationId
    // quando o role não for SUPER_ADMIN
    if (
      requester.role === Role.SUPER_ADMIN &&
      createUserDto.role !== Role.SUPER_ADMIN &&
      !createUserDto.organizationId
    ) {
      throw new BadRequestException(
        'Informe a organização ao criar usuários que não são Super Admin',
      );
    }

    return this.usersService.create(createUserDto);
  }

  // ─── LISTAR USUÁRIOS ─────────────────────────────────────────────────────────
  // SUPER_ADMIN vê todos, ADMIN vê só da sua organização (filtrado no service)
  @Get()
  findAll(@Req() req: RequestWithUser) {
    const requester = req.user;

    if (requester.role !== Role.ADMIN && requester.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Sem permissão para listar usuários');
    }

    return this.usersService.findAll(requester);
  }

  // ─── BUSCAR MEU PERFIL / MEUS GRUPOS ─────────────────────────────────────────
  // Rota específica ANTES do `:id` para não conflitar com findOne
  @Get('me/groups')
  getMyGroups(@Req() req: RequestWithUser) {
    return this.usersService.getUserGroups(req.user.id);
  }

  // ─── BUSCAR USUÁRIO POR ID ────────────────────────────────────────────────────
  // ADMIN e SUPER_ADMIN podem buscar qualquer usuário
  // Usuário comum só pode buscar a si mesmo
  @Get(':id')
  findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    const requester = req.user;

    const isSelf = requester.id === id;
    const isAdminOrAbove =
      requester.role === Role.ADMIN || requester.role === Role.SUPER_ADMIN;

    if (!isSelf && !isAdminOrAbove) {
      throw new ForbiddenException('Sem permissão para ver este usuário');
    }

    return this.usersService.findOne(id);
  }

  // ─── ATUALIZAR USUÁRIO ────────────────────────────────────────────────────────
  @Patch(':id')
  update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const requester = req.user;
    const isSelf = requester.id === id;
    const isAdmin = requester.role === Role.ADMIN;
    const isSuperAdmin = requester.role === Role.SUPER_ADMIN;

    // Usuário comum só pode editar a si mesmo
    if (!isSelf && !isAdmin && !isSuperAdmin) {
      throw new ForbiddenException('Sem permissão para editar este usuário');
    }

    // Ninguém pode alterar o próprio role (exceto SUPER_ADMIN editando outros)
    if (isSelf && updateUserDto.role) {
      throw new ForbiddenException(
        'Você não pode alterar seu próprio perfil de acesso',
      );
    }

    // ADMIN não pode promover usuário a ADMIN ou SUPER_ADMIN
    if (isAdmin && !isSuperAdmin) {
      if (
        updateUserDto.role === Role.SUPER_ADMIN ||
        updateUserDto.role === Role.ADMIN
      ) {
        throw new ForbiddenException(
          'Administradores não podem promover usuários a Admin ou Super Admin',
        );
      }
    }

    return this.usersService.update(id, updateUserDto);
  }

  // ─── DELETAR USUÁRIO ──────────────────────────────────────────────────────────
  @Delete(':id')
  remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    const requester = req.user;

    // Ninguém pode deletar a si mesmo
    if (requester.id === id) {
      throw new ForbiddenException('Você não pode excluir sua própria conta');
    }

    // Apenas ADMIN e SUPER_ADMIN podem deletar
    if (requester.role !== Role.ADMIN && requester.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Sem permissão para excluir usuários');
    }

    // ADMIN só pode deletar usuários da sua organização
    if (requester.role === Role.ADMIN) {
      // A validação de organização é feita no service
      return this.usersService.removeIfSameOrganization(
        id,
        requester.organizationId!,
      );
    }

    return this.usersService.remove(id);
  }
}
