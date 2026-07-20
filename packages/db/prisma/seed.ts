import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Real branch list + one front-of-store STAFF login per branch (used to confirm
// reward redemption QR codes scanned from customers). Order matters: paired 1:1.
const BRANCHES: { name: string; staffEmail: string }[] = [
  { name: "Siam Paragon", staffEmail: "lamunn.saimai.grab@gmail.com" },
  { name: "Central Embassy", staffEmail: "lamunn.saimai.grab.01@gmail.com" },
  { name: "Taopoon (บางซื่อ)", staffEmail: "lamunn.saimai.grab.02@gmail.com" },
  { name: "BTT (บรรทัดทอง)", staffEmail: "lamunn.saimai.grab.03@gmail.com" },
  { name: "Seacon", staffEmail: "lamunn.saimai.grab.04@gmail.com" },
  { name: "Asoke", staffEmail: "lamunn.saimai.grab.05@gmail.com" },
  { name: "The Mall Bangkae", staffEmail: "lamunn.saimai.grab.06@gmail.com" },
  { name: "ICONSIAM", staffEmail: "lamunn.saimai.grab.07@gmail.com" },
  { name: "The Mall Bangkapi", staffEmail: "lamunn.saimai.grab.08@gmail.com" },
  { name: "The Mall Thapra", staffEmail: "lamunn.saimai.grab.09@gmail.com" },
  { name: "EmQ", staffEmail: "lamunn.saimai.grab.10@gmail.com" },
  { name: "Rama 5", staffEmail: "lamunn.saimai.grab.11@gmail.com" },
  { name: "Central Ladprao", staffEmail: "lamunn.saimai.grab.12@gmail.com" },
  { name: "Central Westgate", staffEmail: "lamunn.saimai.grab.13@gmail.com" },
  { name: "The Mall Ngamwongwarn", staffEmail: "lamunn.saimai.grab.14@gmail.com" },
  { name: "Central Pinklao", staffEmail: "lamunn.saimai.grab.15@gmail.com" },
  { name: "Robinson Ratchapruek", staffEmail: "lamunn.saimai.grab.16@gmail.com" },
  { name: "Central Northville", staffEmail: "lamunn.saimai.grab.17@gmail.com" },
  { name: "Emporium", staffEmail: "lamunn.saimai.grab.18@gmail.com" },
  { name: "Central Rama 3", staffEmail: "lamunn.saimai.grab.19@gmail.com" },
  { name: "OneBangkok", staffEmail: "lamunn.saimai.grab.20@gmail.com" },
  { name: "The Mall Ramkamhaeng", staffEmail: "lamunn.saimai.grab.21@gmail.com" },
  { name: "Design Village Bangna", staffEmail: "lamunn.saimai.grab.22@gmail.com" },
];

const BRANCH_STAFF_PASSWORD = "Lamunn1234";

async function main() {
  console.log(`Seeding ${BRANCHES.length} branches + 1 staff login each...`);
  const branchStaffPasswordHash = await bcrypt.hash(BRANCH_STAFF_PASSWORD, 10);

  for (let i = 0; i < BRANCHES.length; i++) {
    const { name, staffEmail } = BRANCHES[i];
    const code = `BR${String(i + 1).padStart(2, "0")}`;

    const branch = await prisma.branch.upsert({
      where: { code },
      update: { name },
      create: { code, name },
    });

    await prisma.staffUser.upsert({
      where: { email: staffEmail.toLowerCase() },
      update: { branchId: branch.id },
      create: {
        name: `พนักงาน — ${name}`,
        email: staffEmail.toLowerCase(),
        passwordHash: branchStaffPasswordHash,
        role: "STAFF",
        branchId: branch.id,
      },
    });
  }

  console.log("Seeding global point rule (25 THB = 1 point)...");
  await prisma.pointRule.upsert({
    where: { id: "seed-global-default-rule" },
    update: {},
    create: {
      id: "seed-global-default-rule",
      name: "ค่าเริ่มต้นทุกสาขา",
      branchId: null,
      bahtPerPoint: 25,
      minAmount: 0,
    },
  });

  const superAdminEmail = process.env.SEED_SUPERADMIN_EMAIL ?? "admin@lamunn.co.th";
  const superAdminPassword = process.env.SEED_SUPERADMIN_PASSWORD ?? "ChangeMe123!";
  console.log(`Seeding super admin (${superAdminEmail})...`);
  await prisma.staffUser.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      name: "Super Admin",
      email: superAdminEmail,
      passwordHash: await bcrypt.hash(superAdminPassword, 10),
      role: "SUPER_ADMIN",
    },
  });

  console.log("Done.");
  console.log(`\nSuper admin login → ${superAdminEmail} / ${superAdminPassword}`);
  console.log(`Branch staff login → <อีเมลตามสาขา> / ${BRANCH_STAFF_PASSWORD}`);
  console.log("⚠️  เปลี่ยนรหัสผ่านเหล่านี้ทันทีเมื่อพร้อมใช้งานจริง");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
