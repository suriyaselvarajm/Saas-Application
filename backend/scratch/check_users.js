const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== AD SETTINGS ===");
  const ad = await prisma.adSettings.findMany();
  console.log(JSON.stringify(ad, null, 2));

  console.log("=== USERS ===");
  const users = await prisma.user.findMany({ take: 10 });
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
