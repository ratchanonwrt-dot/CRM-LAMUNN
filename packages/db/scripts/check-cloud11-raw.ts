import { prisma } from "../src/client";
async function main() {
  const rows: any[] = await prisma.$queryRawUnsafe(
    `SELECT id, name, code, type, is_active FROM public.branches WHERE name ILIKE '%cloud%' OR name ILIKE '%rama 2%';`
  );
  console.log(JSON.stringify(rows, null, 2));
}
main().finally(() => prisma.$disconnect());
