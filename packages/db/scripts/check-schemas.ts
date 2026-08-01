import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  try {
    const schemas: any[] = await prisma.$queryRawUnsafe(
      `SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;`
    );
    console.log("Visible schemas:", schemas.map((s) => s.schema_name));
  } catch (e: any) {
    console.error("schema list failed:", e.message);
  }

  try {
    const tables: any[] = await prisma.$queryRawUnsafe(
      `SELECT table_schema, table_name FROM information_schema.tables
       WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'lamunn_crm')
       ORDER BY table_schema, table_name;`
    );
    console.log("Tables outside lamunn_crm:", tables);
  } catch (e: any) {
    console.error("table list failed:", e.message);
  }
}

main().finally(() => prisma.$disconnect());
