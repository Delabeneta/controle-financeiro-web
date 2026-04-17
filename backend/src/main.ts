import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  process.env.TZ = 'America/Sao_Paulo';

  const app = await NestFactory.create(AppModule);

  console.log('✅ Nest criado');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://controlefinanceiro-theta.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = Number(process.env.PORT) || 10000;

  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Server running on port ${port}`);
}
void bootstrap();
