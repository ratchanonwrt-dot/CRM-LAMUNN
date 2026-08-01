import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const posBranches: { code: string; is_active: boolean; name: string }[] = await prisma.$queryRawUnsafe(
    `SELECT code, is_active, name FROM public.branches;`
  );
  const posByCode = new Map(posBranches.map((b) => [b.code, b]));

  const crmBranches = await prisma.branch.findMany();

  for (const b of crmBranches) {
    const pos = posByCode.get(b.code);
    const shouldBeActive = pos ? pos.is_active : false; // no POS match (e.g. "Seacon") -> treat as inactive
    if (b.isActive !== shouldBeActive) {
      await prisma.branch.update({ where: { id: b.id }, data: { isActive: shouldBeActive } });
      console.log(`${b.name} (${b.code}): isActive ${b.isActive} -> ${shouldBeActive}${pos ? "" : " (no POS match)"}`);
    } else {
      console.log(`${b.name} (${b.code}): already ${b.isActive} (ok)`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
