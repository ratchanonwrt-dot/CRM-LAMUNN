import bcrypt from "bcryptjs";
import { prisma } from "../src/client";

async function main() {
  const email = "temp-verify@lamunn.local";
  const password = "TempVerify123!";
  await prisma.staffUser.upsert({
    where: { email },
    update: { passwordHash: await bcrypt.hash(password, 10), role: "SUPER_ADMIN", isActive: true },
    create: { name: "Temp Verify", email, passwordHash: await bcrypt.hash(password, 10), role: "SUPER_ADMIN" },
  });
  console.log(`${email} / ${password}`);
}
main().finally(() => prisma.$disconnect());
