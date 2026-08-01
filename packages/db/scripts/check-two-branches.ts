import { prisma } from "../src/client";
async function main() {
  const rows: any[] = await prisma.$queryRawUnsafe(
    `SELECT id, name, code, type, is_active FROM public.branches WHERE code IN ('NGAMWONGWAN', 'FASHION');`
  );
  console.log(rows);
}
main().finally(() => prisma.$disconnect());
