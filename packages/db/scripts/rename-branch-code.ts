import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const from = process.argv[2];
  const to = process.argv[3];
  if (!from || !to) {
    console.error("Usage: tsx scripts/rename-branch-code.ts <fromCode> <toCode>");
    process.exit(1);
  }

  const branch = await prisma.branch.findUnique({ where: { code: from.toUpperCase() } });
  if (!branch) {
    console.error(`No branch found with code ${from.toUpperCase()}`);
    process.exit(1);
  }

  console.log(`Found: ${branch.code} — ${branch.name}`);

  const existing = await prisma.branch.findUnique({ where: { code: to.toUpperCase() } });
  if (existing) {
    console.error(`Code ${to.toUpperCase()} is already in use by ${existing.name}`);
    process.exit(1);
  }

  const updated = await prisma.branch.update({
    where: { id: branch.id },
    data: { code: to.toUpperCase() },
  });

  console.log(`Updated: ${updated.name} is now code ${updated.code}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
