import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const branches = await prisma.branch.findMany({ orderBy: { code: "asc" } });
  for (const b of branches) console.log(`${b.code}\t${b.name}`);
}
main().finally(() => prisma.$disconnect());
