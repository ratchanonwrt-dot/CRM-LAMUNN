import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  try {
    const rows: any[] = await prisma.$queryRawUnsafe(`SELECT id, name, code, type, is_active FROM public.branches ORDER BY type, name;`);
    console.log("rows:", rows.length);
    console.log(rows);
  } catch (e: any) {
    console.error("select failed:", e.message);
  }
}
main().finally(() => prisma.$disconnect());
