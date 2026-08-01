import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Corrected against the real POS branch export the user pasted directly (CSV),
// NOT the lamunn_finance.branches table (which turned out to be unrelated/placeholder data).
const RENAMES: { from: string; to: string; name: string }[] = [
  { from: "01", to: "FACTORY", name: "Rama 5 / Factory" },
  { from: "02", to: "TAOPOON", name: "Taopoon" },
  { from: "03", to: "BANTHATTHONG", name: "BTT (บรรทัดทอง)" },
  { from: "04", to: "ASOKE", name: "Asoke" },
  { from: "05", to: "EMBASSY", name: "Central Embassy" },
  { from: "06", to: "EMQUARTIER", name: "EmQ" },
  { from: "07", to: "EMPORIUM", name: "Emporium" },
  { from: "08", to: "THAPHRA", name: "The Mall Thapra" },
  { from: "09", to: "BANGKAPI", name: "The Mall Bangkapi" },
  { from: "10", to: "BANGKAE", name: "The Mall Bangkae" },
  { from: "11", to: "RAMKAMHAENG", name: "The Mall Ramkamhaeng" },
  { from: "12", to: "LADPRAO", name: "Central Ladprao" },
  { from: "13", to: "PINKLAO", name: "Central Pinklao" },
  { from: "14", to: "WESTGATE", name: "Central Westgate" },
  { from: "15", to: "NORTHVILLE", name: "Central Northville" },
  { from: "16", to: "RAMA3", name: "Central Rama 3" },
  { from: "17", to: "PARAGON", name: "Siam Paragon" },
  { from: "18", to: "ICONSIAM", name: "ICONSIAM" },
  { from: "19", to: "RATCHAPRUEK", name: "Robinson Ratchapruek" },
  { from: "20", to: "BANGNA", name: "Design Village Bangna" },
  { from: "21", to: "ONEBANGKOK", name: "OneBangkok" },
  { from: "23", to: "NGAMWONGWAN", name: "The Mall Ngamwongwarn" },
  // "22" (Seacon) intentionally excluded — no match in the real POS list, needs user decision
];

async function main() {
  for (const r of RENAMES) {
    const branch = await prisma.branch.findUnique({ where: { code: r.from } });
    if (!branch) {
      console.error(`SKIP: no branch with code ${r.from} (${r.name})`);
      continue;
    }
    await prisma.branch.update({ where: { id: branch.id }, data: { code: r.to } });
    console.log(`Corrected: ${r.name} — ${r.from} -> ${r.to}`);
  }
  console.log("\nLeft as-is (no match in real POS data): code 22 'Seacon' — needs your decision.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
