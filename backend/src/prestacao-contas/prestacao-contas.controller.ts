// src/prestacao-contas/prestacao-contas.controller.ts
import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PrestacaoContasService } from './prestacao-contas.service';
import { UpdatePrestacaoContasDto } from './dto/update-prestacao-conta.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { User } from '@prisma/client';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('prestacao-contas')
@UseGuards(AuthGuard)
export class PrestacaoContasController {
  constructor(private readonly service: PrestacaoContasService) {}

  // ─── LISTAR STATUS DE UM MÊS/ANO ──────────────────────────────────────────────
  @Get()
  findAll(
    @Req() req: RequestWithUser,
    @Query('mes') mes: string,
    @Query('ano') ano: string,
  ) {
    return this.service.findAll(Number(mes), Number(ano), req.user);
  }

  // ─── ALTERAR STATUS (Feito/Pendente) ──────────────────────────────────────────
  @Patch()
  update(@Body() dto: UpdatePrestacaoContasDto, @Req() req: RequestWithUser) {
    return this.service.update(dto, req.user);
  }
}
