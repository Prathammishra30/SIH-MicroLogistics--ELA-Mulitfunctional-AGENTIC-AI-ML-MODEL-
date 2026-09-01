# Query real seeded users and profiles directly from PostgreSQL using Node or Prisma
import subprocess
import json

script = """
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    take: 10,
    include: {
      farmerProfile: true,
      buyerProfile: true,
      transporterProfile: true,
    }
  });
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
"""

res = subprocess.run(["node", "-e", script], capture_output=True, text=True, cwd="c:/SIH-MicroLogistics")
print(res.stdout)
if res.stderr:
    print("ERR:", res.stderr)
