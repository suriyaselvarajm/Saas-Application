import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { email: 'admin@petrus.io' },
  });
  console.log('Admin users:', users);

  // force reset password
  await prisma.user.updateMany({
    where: { email: 'admin@petrus.io' },
    data: { password: 'admin' },
  });
  console.log('Password reset to "admin"');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
