// backend/src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { HashingService } from './hashing/hashing.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
    private readonly hashingService: HashingService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordIsValid = await this.hashingService.compare(
      loginDto.password,
      user.senha,
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      nome: user.nome,
    };

    const token = this.jwtService.sign(payload);

    // ✅ Retornar também os dados do usuário (frontend espera isso)
    return {
      access_token: token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }
}
