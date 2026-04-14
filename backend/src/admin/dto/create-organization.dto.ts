import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @IsNotEmpty()
  organizationNome!: string;

  @IsNotEmpty()
  adminNome!: string;

  @IsEmail()
  adminEmail!: string;

  @MinLength(6)
  adminSenha!: string;
}
