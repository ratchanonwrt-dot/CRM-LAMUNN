import { prisma } from "../src/client";
async function main() {
  const existing = await prisma.customer.findMany({ select: { phone: true, name: true, pointsBalance: true } });
  console.log(JSON.stringify(existing));
}
main().finally(() => prisma.$disconnect());
