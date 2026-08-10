import bcrypt from "bcryptjs";
import { prisma } from "../src/client";

async function main() {
  const passwordHash = await bcrypt.hash("Lamunn1234", 10);
  const targets = [
    { code: "RAMA9", email: "lamunn.saimai.grab.28@gmail.com" },
    { code: "RAMINDRA01", email: "lamunn.saimai.grab.29@gmail.com" },
  ];

  for (const t of targets) {
    const branch = await prisma.branch.findUnique({ where: { code: t.code } });
    if (!branch) {
      console.log(`skip ${t.code}: branch not found`);
      continue;
    }
    const created = await prisma.staffUser.create({
      data: {
        name: `พนักงาน — ${branch.name}`,
        email: t.email,
        passwordHash,
        role: "STAFF",
        branchId: branch.id,
      },
    });
    console.log(`created ${created.email} for ${branch.name} (${branch.code})`);
  }
}
main().finally(() => prisma.$disconnect());
