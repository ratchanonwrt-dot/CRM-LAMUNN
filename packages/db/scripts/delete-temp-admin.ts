import { prisma } from "../src/client";
async function main() {
  await prisma.staffUser.delete({ where: { email: "temp-verify@lamunn.local" } });
  console.log("deleted");
}
main().finally(() => prisma.$disconnect());
