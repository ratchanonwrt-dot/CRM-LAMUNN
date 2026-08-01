import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const rows: any[] = await prisma.$queryRawUnsafe(
    `SELECT code, name, "isActive" FROM lamunn_finance.branches ORDER BY "sortOrder";`
  );
  console.log(`Total: ${rows.length} branches`);
  console.log(`Active: ${rows.filter((r) => r.isActive).length}`);
  console.log(`Inactive: ${rows.filter((r) => !r.isActive).length}`);
}
main().finally(() => prisma.$disconnect());
