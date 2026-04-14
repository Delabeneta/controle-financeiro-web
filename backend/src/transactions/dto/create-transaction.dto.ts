// create-transaction.dto.ts
import { IsString, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { TransactionType, PaymentType } from '@prisma/client';

export class CreateTransactionDto {
  @IsString()
  groupId!: string;

  @IsEnum(TransactionType)
  tipo!: TransactionType;

  @IsNumber()
  valor!: number;

  @IsString()
  descricao!: string;

  @IsDateString()
  data!: string;

  @IsEnum(PaymentType)
  paymentType!: PaymentType;
}
