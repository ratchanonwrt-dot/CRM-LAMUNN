/** พิสูจน์ว่าตัวกรองของสมุดรายวันคัดใบสำคัญได้ถูกต้อง — ช่วงวันที่ / ซัพพลายเออร์ / ค้นข้อความ
 *
 * สร้างข้อมูลในปี พ.ศ. 2636 (ค.ศ. 2093) แล้วลบทิ้งทั้งหมดใน finally
 * รัน: npx tsx scripts/verify-journal-filters.ts   (จากโฟลเดอร์ Lamunn-Finance)
 */
import { prisma } from "@lamunn/db-finance";
import type { Prisma } from "@lamunn/db-finance";
import { createEntry } from "../src/lib/accounting/post";

const P = "ZZFILTER";
const YEAR = 2093;

let fails = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`  ${ok ? "ผ่าน  " : "ไม่ผ่าน ❌"}  ${label}${ok ? "" : `  (ได้ ${JSON.stringify(actual)} ควรเป็น ${JSON.stringify(expected)})`}`);
  if (!ok) fails++;
}

/** สร้าง where แบบเดียวกับที่หน้าสมุดรายวันใช้ */
function buildWhere(opts: { from?: Date; to?: Date; partnerId?: string; q?: string; accountId?: string }): Prisma.AccJournalEntryWhereInput {
  const usingRange = Boolean(opts.from || opts.to);
  const dateFilter: Prisma.DateTimeFilter = usingRange
    ? { ...(opts.from ? { gte: opts.from } : {}), ...(opts.to ? { lte: opts.to } : {}) }
    : { gte: new Date(Date.UTC(YEAR, 0, 1)), lte: new Date(Date.UTC(YEAR, 11, 31)) };

  const q = (opts.q ?? "").trim();
  return {
    date: dateFilter,
    ...(opts.accountId || opts.partnerId
      ? {
          AND: [
            ...(opts.accountId ? [{ lines: { some: { accountId: opts.accountId } } }] : []),
            ...(opts.partnerId ? [{ lines: { some: { partnerId: opts.partnerId } } }] : []),
          ],
        }
      : {}),
    ...(q
      ? {
          OR: [
            { entryNo: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
            { lines: { some: { memo: { contains: q, mode: "insensitive" as const } } } },
            { lines: { some: { partner: { name: { contains: q, mode: "insensitive" as const } } } } },
          ],
        }
      : {}),
  };
}

const countWith = (opts: Parameters<typeof buildWhere>[0]) =>
  prisma.accJournalEntry.count({ where: { ...buildWhere(opts), entryNo: { startsWith: "" }, description: { startsWith: "[test]" } } });

async function main() {
  const created: string[] = [];
  const partnerIds: string[] = [];
  try {
    const cash = await prisma.accAccount.create({ data: { code: `${P}-1110`, nameTh: "[test] เงินสด", type: "ASSET" } });
    const expense = await prisma.accAccount.create({ data: { code: `${P}-5410`, nameTh: "[test] ค่าใช้จ่าย", type: "EXPENSE" } });
    const supplierA = await prisma.accPartner.create({ data: { name: "[test] ซัพพลายเออร์ อัลฟ่า", type: "CREDITOR" } });
    const supplierB = await prisma.accPartner.create({ data: { name: "[test] ซัพพลายเออร์ เบต้า", type: "CREDITOR" } });
    partnerIds.push(supplierA.id, supplierB.id);

    // 3 ใบ: 5 ม.ค. (อัลฟ่า), 20 ม.ค. (เบต้า), 10 ก.พ. (อัลฟ่า)
    const spec: [number, number, string, string][] = [
      [0, 5, supplierA.id, "[test] ซื้อถุงกระดาษ"],
      [0, 20, supplierB.id, "[test] ค่าขนส่ง"],
      [1, 10, supplierA.id, "[test] ซื้อบรรจุภัณฑ์"],
    ];
    for (const [m, d, pid, desc] of spec) {
      const e = await createEntry({
        date: new Date(Date.UTC(YEAR, m, d)),
        journalType: "PURCHASE",
        description: desc,
        status: "POSTED",
        lines: [
          { accountId: expense.id, debit: 1000, partnerId: pid },
          { accountId: cash.id, credit: 1000 },
        ],
      });
      created.push(e.id);
    }

    console.log("\n=== กรองตามช่วงวันที่ลงบัญชี ===");
    check("ทั้งปี = 3 ใบ", await countWith({}), 3);
    check("1-31 ม.ค. = 2 ใบ", await countWith({ from: new Date(Date.UTC(YEAR, 0, 1)), to: new Date(Date.UTC(YEAR, 0, 31)) }), 2);
    check("6 ม.ค. เป็นต้นไป = 2 ใบ", await countWith({ from: new Date(Date.UTC(YEAR, 0, 6)) }), 2);
    check("ถึง 19 ม.ค. = 1 ใบ", await countWith({ to: new Date(Date.UTC(YEAR, 0, 19)) }), 1);
    check("เจาะวันเดียว 20 ม.ค. = 1 ใบ", await countWith({ from: new Date(Date.UTC(YEAR, 0, 20)), to: new Date(Date.UTC(YEAR, 0, 20)) }), 1);

    console.log("\n=== กรองตามซัพพลายเออร์ ===");
    check("ซัพฯ อัลฟ่า = 2 ใบ", await countWith({ partnerId: supplierA.id }), 2);
    check("ซัพฯ เบต้า = 1 ใบ", await countWith({ partnerId: supplierB.id }), 1);
    check("ซัพฯ อัลฟ่า + เฉพาะเดือน ม.ค. = 1 ใบ", await countWith({ partnerId: supplierA.id, from: new Date(Date.UTC(YEAR, 0, 1)), to: new Date(Date.UTC(YEAR, 0, 31)) }), 1);

    console.log("\n=== ค้นข้อความ ===");
    check("ค้น 'ถุงกระดาษ' (คำอธิบาย) = 1 ใบ", await countWith({ q: "ถุงกระดาษ" }), 1);
    check("ค้น 'เบต้า' (ชื่อซัพฯ ในบรรทัด) = 1 ใบ", await countWith({ q: "เบต้า" }), 1);
    check("ค้น 'อัลฟ่า' = 2 ใบ", await countWith({ q: "อัลฟ่า" }), 2);
    check("ค้นคำที่ไม่มี = 0 ใบ", await countWith({ q: "ไม่มีคำนี้แน่นอน" }), 0);

    console.log("\n=== ผสมหลายตัวกรอง ===");
    check("บัญชีค่าใช้จ่าย + ซัพฯ อัลฟ่า = 2 ใบ", await countWith({ accountId: expense.id, partnerId: supplierA.id }), 2);
    // บัญชีเงินสดไม่มีคู่ค้าผูกไว้ แต่ใบเดียวกันมีบรรทัดของซัพฯ อยู่ -> ต้องยังนับได้
    check("บัญชีเงินสด + ซัพฯ อัลฟ่า = 2 ใบ (คนละบรรทัดในใบเดียวกัน)", await countWith({ accountId: cash.id, partnerId: supplierA.id }), 2);
  } finally {
    console.log("\n=== ลบข้อมูลทดสอบ ===");
    await prisma.accJournalEntry.deleteMany({ where: { id: { in: created } } });
    await prisma.accJournalEntry.deleteMany({ where: { description: { startsWith: "[test]" } } });
    await prisma.accPartner.deleteMany({ where: { id: { in: partnerIds } } });
    await prisma.accAccount.deleteMany({ where: { code: { startsWith: P } } });
    await prisma.accPeriod.deleteMany({ where: { year: YEAR } });
    console.log(`  ข้อมูลทดสอบที่เหลือ: ${await prisma.accAccount.count({ where: { code: { startsWith: P } } })}`);
  }

  console.log(fails === 0 ? "\n✅ ผ่านทั้งหมด\n" : `\n❌ ไม่ผ่าน ${fails} ข้อ\n`);
  process.exit(fails === 0 ? 0 : 1);
}

main();
