// backend/src/groups/dto/create-group.dto.ts
import { IsNotEmpty, IsUUID, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGroupDto {
  @IsNotEmpty()
  nome!: string;

  @IsUUID()
  organizationId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  saldoInicial?: number;

  @IsOptional()
  leaderName?: string;
}
