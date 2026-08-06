import { prisma } from "../src/client";
async function main() {
  const rows: any[] = await prisma.$queryRawUnsafe(
    `SELECT code, name, type, is_active FROM public.branches ORDER BY name;`
  );
  for (const r of rows) console.log(`${r.code}\t${r.name}\t${r.type}\t${r.is_active ? "active" : "inactive"}`);
  console.log("---total---", rows.length);
}
main().finally(() => prisma.$disconnect());
