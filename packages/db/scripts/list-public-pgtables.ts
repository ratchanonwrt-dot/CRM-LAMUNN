import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  try {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename;`
    );
    console.log("public tables (pg_tables):", rows);
  } catch (e: any) {
    console.error("failed:", e.message);
  }
}
main().finally(() => prisma.$disconnect());
