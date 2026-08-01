import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function inspect(table: string) {
  console.log(`\n=== ${table} ===`);
  try {
    const cols: any[] = await prisma.$queryRawUnsafe(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = '${table}' ORDER BY ordinal_position;`
    );
    console.log("columns:", cols);
  } catch (e: any) {
    console.error("columns failed:", e.message);
    return;
  }

  try {
    const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM public.${table} ORDER BY 1 DESC LIMIT 5;`);
    console.log("sample rows:", rows);
  } catch (e: any) {
    console.error("select failed:", e.message);
  }
}

async function main() {
  await inspect("pos_bills");
  await inspect("pos_sales_records");
}

main().finally(() => prisma.$disconnect());
