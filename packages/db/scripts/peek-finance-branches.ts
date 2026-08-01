import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  try {
    const cols: any[] = await prisma.$queryRawUnsafe(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_schema = 'lamunn_finance' AND table_name = 'branches'
       ORDER BY ordinal_position;`
    );
    console.log("columns:", cols);
  } catch (e: any) {
    console.error("columns failed:", e.message);
  }

  try {
    const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM lamunn_finance.branches LIMIT 30;`);
    console.log("rows:", rows);
  } catch (e: any) {
    console.error("select failed:", e.message);
  }
}
main().finally(() => prisma.$disconnect());
