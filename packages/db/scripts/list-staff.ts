import { prisma } from "../src/client";
async function main() {
  const staff = await prisma.staffUser.findMany({ select: { id: true, name: true, email: true, role: true, isActive: true } });
  console.log(JSON.stringify(staff, null, 2));
}
main().finally(() => prisma.$disconnect());
