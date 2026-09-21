import { PrismaClient } from ".prisma/client-catering";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const branches = [
    { name: "Factory", sortOrder: 1 },
    { name: "Asoke", sortOrder: 2 },
  ];
  for (const b of branches) {
    const existing = await prisma.branch.findFirst({ where: { name: b.name } });
    if (!existing) await prisma.branch.create({ data: b });
  }

  const packages = [
    { name: "แพคเกจเล็ก", description: "สำหรับงานไม่เกิน 30 คน", price: 5000, sortOrder: 1 },
    { name: "แพคเกจกลาง", description: "สำหรับงาน 30-80 คน", price: 12000, sortOrder: 2 },
    { name: "แพคเกจใหญ่", description: "สำหรับงาน 80 คนขึ้นไป", price: 25000, sortOrder: 3 },
  ];
  for (const p of packages) {
    const existing = await prisma.cateringPackage.findFirst({ where: { name: p.name } });
    if (!existing) await prisma.cateringPackage.create({ data: p });
  }

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@lamunn.co.th";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Lamunn100m";
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.staffUser.upsert({
    where: { email },
    update: {},
    create: { name: "Catering Admin", email, passwordHash, role: "SUPER_ADMIN" },
  });

  console.log(`Seeded ${branches.length} branches, ${packages.length} packages, admin user (${email}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
