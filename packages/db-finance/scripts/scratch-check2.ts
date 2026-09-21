import { prisma } from "../src/client";
async function main() {
  const rows = await prisma.branch.findMany({ where: { code: { in: ["28", "29", "16"] } } });
  console.log(JSON.stringify(rows, null, 2));
}
main().finally(() => prisma.$disconnect());
