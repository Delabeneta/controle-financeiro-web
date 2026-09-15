// update-prestacao-contas.dto.ts
import { IsString, IsInt, IsEnum, Min, Max } from 'class-validator';
import { PrestacaoStatus } from '@prisma/client';

export class UpdatePrestacaoContasDto {
  @IsString()
  groupId!: string;

  @IsInt()
  @Min(1)
  @Max(12)
  mes!: number;

  @IsInt()
  ano!: number;

  @IsEnum(PrestacaoStatus)
  status!: PrestacaoStatus;
}
