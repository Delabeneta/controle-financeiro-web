// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);

  // Criar Super Admin
  await prisma.user.upsert({
    where: { email: 'super@email.com' },
    update: {},
    create: {
      nome: 'Super Admin',
      email: 'super@email.com',
      senha: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('✅ Super Admin criado');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
