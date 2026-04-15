// backend/src/transactions/dto/update-transaction.dto.ts
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { PaymentType, TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateTransactionDto {
  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  valor?: number;

  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;

  @IsOptional()
  @IsEnum(TransactionType)
  tipo?: TransactionType;

  @IsOptional()
  @IsDateString()
  data?: string;
}
