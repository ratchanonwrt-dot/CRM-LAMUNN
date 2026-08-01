import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// name-matched against lamunn_finance.branches (the POS's own branch master data)
const RENAMES: { from: string; to: string; name: string }[] = [
  { from: "BR01", to: "17", name: "Siam Paragon" },
  { from: "BR02", to: "05", name: "Central Embassy" },
  { from: "BR03", to: "02", name: "Taopoon" },
  { from: "BR04", to: "03", name: "BTT (บรรทัดทอง)" },
  { from: "BR05", to: "22", name: "Seacon" },
  { from: "BR06", to: "04", name: "Asoke" },
  { from: "BR07", to: "10", name: "The Mall Bangkae" },
  { from: "BR08", to: "18", name: "ICONSIAM" },
  { from: "BR09", to: "09", name: "The Mall Bangkapi" },
  { from: "THAPHRA", to: "08", name: "The Mall Thapra" },
  { from: "BR11", to: "06", name: "EmQ" },
  { from: "BR13", to: "12", name: "Central Ladprao" },
  { from: "BR14", to: "14", name: "Central Westgate" },
  { from: "BR15", to: "23", name: "The Mall Ngamwongwarn" },
  { from: "BR16", to: "13", name: "Central Pinklao" },
  { from: "BR17", to: "19", name: "Robinson Ratchapruek" },
  { from: "BR18", to: "15", name: "Central Northville" },
  { from: "BR19", to: "07", name: "Emporium" },
  { from: "BR20", to: "16", name: "Central Rama 3" },
  { from: "BR21", to: "21", name: "OneBangkok" },
  { from: "BR22", to: "11", name: "The Mall Ramkamhaeng" },
  { from: "BR23", to: "20", name: "Design Village Bangna" },
];

async function main() {
  for (const r of RENAMES) {
    const branch = await prisma.branch.findUnique({ where: { code: r.from } });
    if (!branch) {
      console.error(`SKIP: no branch with code ${r.from} (${r.name})`);
      continue;
    }
    if (branch.code === r.to) {
      console.log(`OK (unchanged): ${r.name} already ${r.to}`);
      continue;
    }
    await prisma.branch.update({ where: { id: branch.id }, data: { code: r.to } });
    console.log(`Renamed: ${r.name} — ${r.from} -> ${r.to}`);
  }

  console.log("\nDone. Left untouched (needs manual confirmation): BR12 (Rama 5) — no clear match in POS branches table.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
