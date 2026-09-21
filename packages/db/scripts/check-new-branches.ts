import { prisma } from "../src/client";
async function main() {
  const rows: any[] = await prisma.$queryRawUnsafe(
    `SELECT code, name, type, is_active FROM public.branches WHERE name ILIKE '%rama 9%' OR name ILIKE '%ramindra%' OR name ILIKE '%ram indra%';`
  );
  console.log(JSON.stringify(rows, null, 2));
}
main().finally(() => prisma.$disconnect());
