import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const rows: any[] = await prisma.$queryRawUnsafe(
    `SELECT code, name, type, "isActive" FROM lamunn_finance.branches ORDER BY "sortOrder";`
  );
  for (const r of rows) console.log(`${r.code}\t${r.name}\t${r.type}\t${r.isActive ? "active" : "inactive"}`);
}
main().finally(() => prisma.$disconnect());
