import { PrismaClient } from ".prisma/client-live";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const channels = [
    { name: "TikTok", sortOrder: 1 },
    { name: "Facebook", sortOrder: 2 },
    { name: "Shopee Live", sortOrder: 3 },
  ];
  for (const c of channels) {
    const existing = await prisma.channel.findFirst({ where: { name: c.name } });
    if (!existing) await prisma.channel.create({ data: c });
  }

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@lamunn.co.th";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Lamunn100m";
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.staffUser.upsert({
    where: { email },
    update: {},
    create: { name: "Live Admin", email, passwordHash, role: "SUPER_ADMIN" },
  });

  console.log(`Seeded ${channels.length} channels, admin user (${email}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
