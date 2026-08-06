import { prisma } from "../src/client";
async function main() {
  const total = await prisma.otpCode.count();
  const withToken = await prisma.otpCode.count({ where: { token: { not: null } } });
  const consumed = await prisma.otpCode.count({ where: { consumedAt: { not: null } } });
  const recent = await prisma.otpCode.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
    select: { phone: true, createdAt: true, token: true, codeHash: true, consumedAt: true, attempts: true },
  });
  console.log(JSON.stringify({ total, withToken, consumed, recent }, null, 2));
}
main().finally(() => prisma.$disconnect());
