import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Validação
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  // ✅ CORS correto (SEM * quando usa credentials)
  app.enableCors({
    origin: 'https://controlefinanceiro-theta.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 🔥 SOLUÇÃO DO SEU ERRO (OPTIONS na Vercel)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS') {
      res.header(
        'Access-Control-Allow-Origin',
        'https://controlefinanceiro-theta.vercel.app',
      );
      res.header(
        'Access-Control-Allow-Methods',
        'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      );
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.sendStatus(204);
    }
    next();
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
