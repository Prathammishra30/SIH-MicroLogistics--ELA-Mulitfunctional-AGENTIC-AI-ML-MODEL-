import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { role: 'FARMER' },
    include: { farmerProfile: true },
  });
  console.log('REAL_FARMER_USER:', JSON.stringify(user));
}

main().finally(() => prisma.$disconnect());
