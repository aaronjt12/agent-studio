import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const demoUsername = 'demo';
  const demoEmail = 'demo@example.com';
  const demoPassword = 'demo123';

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username: demoUsername }, { email: demoEmail }] }
  });

  if (!existing) {
    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(demoPassword, salt);

    const user = await prisma.user.create({
      data: {
        email: demoEmail,
        username: demoUsername,
        password: hashed,
        name: 'Demo User',
      }
    });

    console.log('Created demo user:', { username: user.username, password: demoPassword });
  } else {
    console.log('Demo user already exists; skipping creation');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




