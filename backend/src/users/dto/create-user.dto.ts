import { Role } from '@prisma/client';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsUUID,
  IsOptional,
  IsEnum,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  nome!: string;

  @IsEmail()
  email!: string;

  @MinLength(6)
  senha!: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsEnum(Role)
  role!: Role;
}
