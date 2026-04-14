import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UnauthorizedException,
  UseGuards,
  Query,
  Patch,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { User } from '@prisma/client';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}
  @Post()
  async create(
    @Body() createTransactionDto: CreateTransactionDto,
    @Req() req: RequestWithUser, // ou usar um decorator @CurrentUser()
  ) {
    const userId = req.user?.id; // Pega o ID do usuário logado
    if (!userId) {
      throw new UnauthorizedException('Usuário não encontrado no token');
    }
    return this.transactionsService.create(createTransactionDto, userId);
  }
  @Get()
  findAll(@Req() req: RequestWithUser) {
    if (!req.user) {
      throw new UnauthorizedException();
    }

    return this.transactionsService.findAll(req.user);
  }

  @Get('group/:groupId')
  async findByGroup(
    @Param('groupId') groupId: string,
    @Req() req: RequestWithUser,
    @Query('type') type?: 'ENTRADA' | 'SAIDA', // ← NOVO
  ) {
    return this.transactionsService.findByGroup(groupId, type, req.user);
  }

  @Get()
  async findAllWithFilters(
    @Req() req: RequestWithUser,
    @Query('type') type?: 'ENTRADA' | 'SAIDA',
    @Query('paymentType') paymentType?: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.transactionsService.findAllWithFilters(
      { type, paymentType, groupId },
      req.user,
    );
  }

  // backend/src/transactions/transactions.controller.ts
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Usuário não encontrado no token');
    }
    return this.transactionsService.update(id, updateTransactionDto, userId);
  }
}
