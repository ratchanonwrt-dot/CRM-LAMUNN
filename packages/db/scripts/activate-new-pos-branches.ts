import { prisma } from "../src/client";

async function main() {
  const ngamwongwan = await prisma.branch.findUnique({ where: { code: "NGAMWONGWAN" } });
  if (ngamwongwan) {
    if (!ngamwongwan.isActive) {
      await prisma.branch.update({ where: { id: ngamwongwan.id }, data: { isActive: true } });
      console.log("Activated: The Mall Ngamwongwan (NGAMWONGWAN)");
    } else {
      console.log("Already active: NGAMWONGWAN");
    }
  } else {
    console.log("SKIP: no CRM branch with code NGAMWONGWAN found");
  }

  const fashion = await prisma.branch.findUnique({ where: { code: "FASHION" } });
  if (!fashion) {
    const created = await prisma.branch.create({ data: { code: "FASHION", name: "Fashion Island", isActive: true } });
    console.log("Created: Fashion Island (FASHION)", created.id);
  } else {
    if (!fashion.isActive) {
      await prisma.branch.update({ where: { id: fashion.id }, data: { isActive: true } });
      console.log("Activated existing: Fashion Island (FASHION)");
    } else {
      console.log("Already active: FASHION");
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
