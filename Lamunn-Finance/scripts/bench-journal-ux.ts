/** วัดเวลาฝั่งเซิร์ฟเวอร์ของเส้นทางที่คนคีย์บัญชีกดบ่อยที่สุด (อ่านอย่างเดียว ยกเว้นใบทดสอบที่ลบทิ้งใน finally)
 * รัน: npx tsx scripts/bench-journal-ux.ts   (จากโฟลเดอร์ Lamunn-Finance)
 */
import { prisma } from "@lamunn/db-finance";
import { createEntry, postEntry, unpostEntry } from "../src/lib/accounting/post";
import { monthRange } from "../src/lib/dates";

let sqlCount = 0;
prisma.$on("query" as never, () => sqlCount++);

async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const c0 = sqlCount;
  const t0 = performance.now();
  const r = await fn();
  console.log(`  ${label.padEnd(44)} ${(performance.now() - t0).toFixed(0).padStart(5)} ms   ${sqlCount - c0} SQL`);
  return r;
}

async function main() {
  const now = new Date();
  const { start, end } = monthRange(now.getUTCFullYear(), now.getUTCMonth());
  const where = { date: { gte: start, lte: end } };
  await prisma.$queryRaw`select 1`; // อุ่นคอนเนกชัน

  console.log("\n=== หน้าสมุดรายวัน (ที่ทำอยู่ตอนนี้) ===");
  await timed("ping", () => prisma.$queryRaw`select 1`);
  await timed("findMany 50 ใบ + lines + account + partner", () =>
    prisma.accJournalEntry.findMany({
      where, orderBy: [{ date: "asc" }, { entryNo: "asc" }], take: 50,
      include: { lines: { orderBy: { sortOrder: "asc" }, include: { account: { select: { code: true, nameTh: true } }, partner: { select: { name: true } } } } },
    }));
  await timed("count", () => prisma.accJournalEntry.count({ where }));
  await timed("partners ทั้งหมด", () => prisma.accPartner.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, type: true, phone: true } }));
  await timed("draftCount (ยิงต่อท้าย)", () => prisma.accJournalEntry.count({ where: { ...where, status: "DRAFT" } }));

  console.log("\n=== หน้าคีย์ใบสำคัญใหม่ ===");
  await timed("accounts", () => prisma.accAccount.findMany({ where: { isActive: true, isPostable: true }, orderBy: { code: "asc" } }));
  await timed("branches", () => prisma.branch.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }));
  await timed("recent 200 descriptions", () => prisma.accJournalEntry.findMany({ orderBy: { createdAt: "desc" }, take: 200, select: { description: true } }));
  await timed("recent 300 memos (orderBy entry.createdAt)", () =>
    prisma.accJournalLine.findMany({ where: { memo: { not: null } }, orderBy: { entry: { createdAt: "desc" } }, take: 300, select: { memo: true } }));

  console.log("\n=== การกดปุ่ม ===");
  const [a, b] = await prisma.accAccount.findMany({ where: { isPostable: true, isActive: true }, take: 2 });
  const created: string[] = [];
  try {
    const e = await timed("createEntry (บันทึกเป็นร่าง)", () =>
      createEntry({ date: new Date(Date.UTC(2093, 5, 1)), description: "[bench] ทดสอบ", lines: [{ accountId: a.id, debit: 10 }, { accountId: b.id, credit: 10 }] }));
    created.push(e.id);
    await timed("postEntry (ผ่านรายการ)", () => postEntry(e.id));
    await timed("unpostEntry (ยกเลิกผ่านรายการ)", () => unpostEntry(e.id));
  } finally {
    await prisma.accJournalEntry.deleteMany({ where: { id: { in: created } } });
    await prisma.accPeriod.deleteMany({ where: { year: 2093 } });
  }
  console.log();
}
main().finally(() => prisma.$disconnect());
