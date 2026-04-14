// backend/prisma.config.ts
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts', // ← Apenas a string do comando
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
