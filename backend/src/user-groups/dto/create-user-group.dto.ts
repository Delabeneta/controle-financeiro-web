import { GroupPermission } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class CreateUserGroupDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  groupId!: string;

  @IsOptional()
  @IsEnum(GroupPermission)
  permission?: GroupPermission;
}
