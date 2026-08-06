import bcrypt from "bcryptjs";
import { prisma } from "../src/client";

const SHARED_PASSWORD = "Lamunn1234";

async function main() {
  const branches = await prisma.branch.findMany();
  const staff = await prisma.staffUser.findMany({ where: { role: "STAFF" } });
  const branchIdsWithStaff = new Set(staff.map((s) => s.branchId));
  const missing = branches.filter((b) => !branchIdsWithStaff.has(b.id));

  console.log(`Branches without a staff account: ${missing.length}`);
  const passwordHash = await bcrypt.hash(SHARED_PASSWORD, 10);

  // find the highest existing "lamunn.saimai.grab.NN@gmail.com" suffix to continue numbering
  const nums = staff
    .map((s) => s.email.match(/lamunn\.saimai\.grab\.(\d+)@gmail\.com/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => Number(m[1]));
  let next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;

  const created: string[] = [];
  for (const b of missing) {
    const email = `lamunn.saimai.grab.${String(next).padStart(2, "0")}@gmail.com`;
    await prisma.staffUser.create({
      data: {
        name: `พนักงาน — ${b.name}`,
        email,
        passwordHash,
        role: "STAFF",
        branchId: b.id,
      },
    });
    created.push(`${b.name} -> ${email}`);
    next += 1;
  }

  // reset password for every STAFF-role account (existing + newly created)
  const resetResult = await prisma.staffUser.updateMany({
    where: { role: "STAFF" },
    data: { passwordHash },
  });

  console.log("Created:", JSON.stringify(created, null, 2));
  console.log(`Password reset to shared password for ${resetResult.count} STAFF accounts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
