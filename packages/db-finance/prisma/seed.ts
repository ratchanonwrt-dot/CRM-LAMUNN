import { PrismaClient, BranchType, RentType } from "../src/generated/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Standard Credit Term cycle used by most malls: 1-15 due on day 30 of the same
// month, 16-end due on day 1 of the following month, both GP% deducted.
const STANDARD_CT_CYCLE = {
  splitMonth: true,
  period1PayDay: 30,
  period1PayMonthOffset: 0,
  period2PayDay: 1,
  period2PayMonthOffset: 1,
  fullMonthPayDay: null as number | null,
  fullMonthPayMonthOffset: 1,
  deductDeliveryGp: true,
};

interface BranchSeed {
  code: string;
  name: string;
  type: BranchType;
  sortOrder: number;
  rent: {
    rentType: RentType;
    gpPercentStorefront?: number;
    gpPercentDelivery?: number;
    fixRateAmount?: number;
    vendorFeeMonthly?: number;
    note?: string;
  };
  creditTerm?: Partial<typeof STANDARD_CT_CYCLE>;
}

// Extracted from "2.0 Revenue Record 2026" — สรุปยอดขาย / ค่าเช่า / Credit Term sheets.
const branches: BranchSeed[] = [
  { code: "01", name: "Factory", type: "CASH", sortOrder: 1, rent: { rentType: "FIX_RATE", fixRateAmount: 80000 } },
  { code: "02", name: "Taopoon", type: "CASH", sortOrder: 2, rent: { rentType: "FIX_RATE", fixRateAmount: 0 } },
  { code: "03", name: "Banthatthong", type: "CASH", sortOrder: 3, rent: { rentType: "FIX_RATE", fixRateAmount: 0 } },
  { code: "04", name: "Asoke", type: "CASH", sortOrder: 4, rent: { rentType: "GP", gpPercentStorefront: 0, gpPercentDelivery: 0, note: "ยังไม่ตั้งค่า GP% — แก้ไขได้ที่หน้าตั้งค่าสาขา" } },
  {
    code: "05",
    name: "Central Embassy",
    type: "CREDIT_TERM",
    sortOrder: 5,
    rent: { rentType: "GP", gpPercentStorefront: 0.25, gpPercentDelivery: 0, vendorFeeMonthly: 3000 },
    creditTerm: { splitMonth: false, fullMonthPayDay: 25, fullMonthPayMonthOffset: 1, deductDeliveryGp: false },
  },
  {
    code: "06",
    name: "EmQuartier",
    type: "CREDIT_TERM",
    sortOrder: 6,
    rent: { rentType: "GP", gpPercentStorefront: 0.25, gpPercentDelivery: 0.1 },
    creditTerm: STANDARD_CT_CYCLE,
  },
  {
    code: "07",
    name: "Emporium",
    type: "CREDIT_TERM",
    sortOrder: 7,
    rent: { rentType: "GP", gpPercentStorefront: 0.25, gpPercentDelivery: 0.1 },
    creditTerm: STANDARD_CT_CYCLE,
  },
  {
    code: "08",
    name: "The Mall Thrapa",
    type: "CREDIT_TERM",
    sortOrder: 8,
    rent: { rentType: "GP", gpPercentStorefront: 0.25, gpPercentDelivery: 0.1 },
    creditTerm: STANDARD_CT_CYCLE,
  },
  {
    code: "09",
    name: "The Mall Bangkapi",
    type: "CREDIT_TERM",
    sortOrder: 9,
    rent: { rentType: "GP", gpPercentStorefront: 0.23, gpPercentDelivery: 0.1 },
    creditTerm: STANDARD_CT_CYCLE,
  },
  {
    code: "10",
    name: "The Mall Bangkae",
    type: "CREDIT_TERM",
    sortOrder: 10,
    rent: { rentType: "GP", gpPercentStorefront: 0.25, gpPercentDelivery: 0.1 },
    creditTerm: STANDARD_CT_CYCLE,
  },
  { code: "11", name: "The Mall Ram", type: "CASH", sortOrder: 11, rent: { rentType: "FIX_RATE", fixRateAmount: 15000, note: "ปรับจากสูตร GP เดิมเป็นค่าเช่าคงที่" } },
  { code: "12", name: "Central Ladprao", type: "CASH", sortOrder: 12, rent: { rentType: "GP", gpPercentStorefront: 0.18, gpPercentDelivery: 0.1 } },
  { code: "13", name: "Central Pinklao", type: "CASH", sortOrder: 13, rent: { rentType: "GP", gpPercentStorefront: 0.18, gpPercentDelivery: 0.1 } },
  { code: "14", name: "Central Westgate", type: "CASH", sortOrder: 14, rent: { rentType: "GP", gpPercentStorefront: 0.18, gpPercentDelivery: 0.1 } },
  {
    code: "15",
    name: "Central NorthVille",
    type: "CREDIT_TERM",
    sortOrder: 15,
    rent: { rentType: "GP", gpPercentStorefront: 0.25, gpPercentDelivery: 0.1 },
    creditTerm: {
      splitMonth: true,
      period1PayDay: 25,
      period1PayMonthOffset: 0,
      period2PayDay: 10,
      period2PayMonthOffset: 1,
      deductDeliveryGp: true,
    },
  },
  { code: "16", name: "Central Rama 3", type: "CASH", sortOrder: 16, rent: { rentType: "GP", gpPercentStorefront: 0.25, gpPercentDelivery: 0.1 } },
  { code: "17", name: "Siam Paragon", type: "CASH", sortOrder: 17, rent: { rentType: "GP", gpPercentStorefront: 0.18, gpPercentDelivery: 0.1 } },
  { code: "18", name: "Iconsiam", type: "CASH", sortOrder: 18, rent: { rentType: "GP", gpPercentStorefront: 0.18, gpPercentDelivery: 0.1 } },
  { code: "19", name: "Robinson Ratchapruek", type: "CASH", sortOrder: 19, rent: { rentType: "FIX_RATE", fixRateAmount: 30000, note: "ปรับจากสูตร GP เดิมเป็นค่าเช่าคงที่" } },
  {
    code: "20",
    name: "Design Village Bangna",
    type: "CREDIT_TERM",
    sortOrder: 20,
    rent: { rentType: "GP", gpPercentStorefront: 0.25, gpPercentDelivery: 0.1 },
    creditTerm: STANDARD_CT_CYCLE,
  },
  { code: "21", name: "One Bangkok", type: "CASH", sortOrder: 21, rent: { rentType: "GP", gpPercentStorefront: 0.25, gpPercentDelivery: 0.1 } },
  { code: "22", name: "Seacon Bangkae", type: "CASH", sortOrder: 22, rent: { rentType: "GP", gpPercentStorefront: 0, gpPercentDelivery: 0, note: "ยังไม่ตั้งค่า GP% — แก้ไขได้ที่หน้าตั้งค่าสาขา" } },
  {
    code: "23",
    name: "The Mall Ngamwongwarn",
    type: "CREDIT_TERM",
    sortOrder: 23,
    rent: { rentType: "GP", gpPercentStorefront: 0, gpPercentDelivery: 0, note: "ยังไม่ตั้งค่า GP% — แก้ไขได้ที่หน้าตั้งค่าสาขา" },
    creditTerm: STANDARD_CT_CYCLE,
  },
];

async function main() {
  for (const b of branches) {
    const branch = await prisma.branch.upsert({
      where: { code: b.code },
      update: { name: b.name, type: b.type, sortOrder: b.sortOrder },
      create: { code: b.code, name: b.name, type: b.type, sortOrder: b.sortOrder },
    });

    await prisma.rentConfig.upsert({
      where: { branchId: branch.id },
      update: b.rent,
      create: { branchId: branch.id, ...b.rent },
    });

    if (b.type === "CREDIT_TERM") {
      const cycle = { ...STANDARD_CT_CYCLE, ...(b.creditTerm ?? {}) };
      await prisma.creditTermCycleConfig.upsert({
        where: { branchId: branch.id },
        update: cycle,
        create: { branchId: branch.id, ...cycle },
      });
    }
  }

  // Grab: หัก GP 23% + VAT 7% บนค่า GP นั้น. Lineman: หัก 15% (รวม VAT แล้ว)
  await prisma.setting.upsert({
    where: { key: "grabFeePercent" },
    update: {},
    create: { key: "grabFeePercent", value: "0.23" },
  });
  await prisma.setting.upsert({
    where: { key: "grabFeeVatPercent" },
    update: {},
    create: { key: "grabFeeVatPercent", value: "0.07" },
  });
  await prisma.setting.upsert({
    where: { key: "linemanFeePercent" },
    update: {},
    create: { key: "linemanFeePercent", value: "0.15" },
  });
  await prisma.setting.upsert({
    where: { key: "cashOpeningBalance" },
    update: { value: "-40000" },
    create: { key: "cashOpeningBalance", value: "-40000" },
  });
  await prisma.setting.upsert({
    where: { key: "cashOpeningDate" },
    update: { value: "2026-06-30" },
    create: { key: "cashOpeningDate", value: "2026-06-30" },
  });

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@lamunn.co.th";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Lamunn100m";
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.staffUser.upsert({
    where: { email },
    update: {},
    create: { name: "Finance Admin", email, passwordHash, role: "ADMIN" },
  });

  console.log(`Seeded ${branches.length} branches + admin user (${email}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
