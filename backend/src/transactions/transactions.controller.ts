// src/transactions/transactions.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { PaymentType, User } from '@prisma/client';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // ─── CRIAR TRANSAÇÃO ──────────────────────────────────────────────────────────
  @Post()
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.transactionsService.create(createTransactionDto, req.user);
  }

  // ─── LISTAR TRANSAÇÕES COM FILTROS OPCIONAIS ──────────────────────────────────
  @Get()
  findAll(
    @Req() req: RequestWithUser,
    @Query('type') type?: 'ENTRADA' | 'SAIDA',
    @Query('paymentType') paymentType?: PaymentType,
    @Query('groupId') groupId?: string,
  ) {
    if (type || paymentType || groupId) {
      return this.transactionsService.findAllWithFilters(
        { type, paymentType, groupId },
        req.user,
      );
    }

    return this.transactionsService.findAll(req.user);
  }

  // ─── LISTAR POR GRUPO ─────────────────────────────────────────────────────────
  @Get('group/:groupId')
  findByGroup(
    @Param('groupId') groupId: string,
    @Req() req: RequestWithUser,
    @Query('type') type?: 'ENTRADA' | 'SAIDA',
  ) {
    return this.transactionsService.findByGroup(groupId, type, req.user);
  }

  // ─── BUSCAR UMA TRANSAÇÃO ─────────────────────────────────────────────────────
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.transactionsService.findOne(id, req.user);
  }

  // ─── EDITAR TRANSAÇÃO ─────────────────────────────────────────────────────────
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.transactionsService.update(id, updateTransactionDto, req.user);
  }

  // ─── DELETAR TRANSAÇÃO ────────────────────────────────────────────────────────
  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.transactionsService.delete(id, req.user);
  }
}
