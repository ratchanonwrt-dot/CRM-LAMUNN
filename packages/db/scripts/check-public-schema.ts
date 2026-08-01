import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  try {
    const tables: any[] = await prisma.$queryRawUnsafe(
      `SELECT table_schema, table_name FROM information_schema.tables
       WHERE table_schema = 'public' ORDER BY table_name;`
    );
    console.log("public schema tables:", tables);
  } catch (e: any) {
    console.error("failed:", e.message);
  }
}
main().finally(() => prisma.$disconnect());
