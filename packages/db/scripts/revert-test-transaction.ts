import { prisma } from "../src/client";
async function main() {
  const customer = await prisma.customer.findUnique({ where: { phone: "0869031899" } });
  if (!customer) return console.log("not found");

  const testTx = await prisma.pointTransaction.findFirst({
    where: { customerId: customer.id, type: "EARN", amount: 350, points: 3, note: "กรอกยอดซื้อด้วยตนเอง" },
    orderBy: { createdAt: "desc" },
  });
  if (!testTx) return console.log("test transaction not found (already clean?)");

  await prisma.$transaction([
    prisma.pointTransaction.delete({ where: { id: testTx.id } }),
    prisma.customer.update({
      where: { id: customer.id },
      data: { pointsBalance: { decrement: testTx.points }, lifetimePoints: { decrement: testTx.points } },
    }),
  ]);
  console.log("reverted (deleted test EARN row, decremented balance by", testTx.points, ")");
}
main().finally(() => prisma.$disconnect());
