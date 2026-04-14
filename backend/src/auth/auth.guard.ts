import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from '@prisma/client';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = request.headers['authorization']?.split(' ')[1];

    if (!token) {
      console.log('No token provided');
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtService.verify<{
        nome: string;
        email: string;
        role: Role;
        sub: string;
      }>(token, {
        algorithms: ['HS256'],
      });

      console.log('Payload decodificado:', payload); // ← Debug

      const user = await this.prismaService.user.findUnique({
        where: { id: payload.sub },
      });

      console.log('Usuário encontrado:', user?.id); // ← Debug

      if (!user) {
        console.log(' User not found for sub:', payload.sub);

        throw new UnauthorizedException('User not found');
      }
      request.user = user;
    } catch (e) {
      console.error(' Erro na validação do token:', e);
      throw new UnauthorizedException('Invalid token', { cause: e });
    }

    return true;
  }
}
