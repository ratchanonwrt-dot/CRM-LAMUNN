/** พิสูจน์การเรียกคืนใบสำคัญที่ยกเลิกแล้ว (restoreEntry) — ข้อมูลปี 2091 ลบทิ้งใน finally
 * รัน: npx tsx scripts/verify-restore.ts */
import { prisma } from "@lamunn/db-finance";
import { createEntry, postEntry, voidEntry, restoreEntry } from "../src/lib/accounting/post";

const P = "ZZRESTORE";
const YEAR = 2091;
let fails = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`  ${ok ? "ผ่าน  " : "ไม่ผ่าน ❌"}  ${label}${ok ? "" : `  (ได้ ${JSON.stringify(actual)} ควรเป็น ${JSON.stringify(expected)})`}`);
  if (!ok) fails++;
}
async function main() {
  const created: string[] = [];
  try {
    const a = await prisma.accAccount.create({ data: { code: `${P}-1`, nameTh: "[test] ก", type: "ASSET" } });
    const b = await prisma.accAccount.create({ data: { code: `${P}-2`, nameTh: "[test] ข", type: "REVENUE" } });
    const e = await createEntry({ date: new Date(Date.UTC(YEAR, 0, 5)), description: "[test] เรียกคืน", status: "POSTED", lines: [{ accountId: a.id, debit: 100 }, { accountId: b.id, credit: 100 }] });
    created.push(e.id);
    await voidEntry(e.id);
    check("ยกเลิกแล้วบรรทัดเป็น VOID", (await prisma.accJournalLine.findMany({ where: { entryId: e.id } })).map((l) => l.status), ["VOID", "VOID"]);

    const r = await restoreEntry(e.id, "tester");
    check("เรียกคืนแล้วกลับเป็นร่าง", r.status, "DRAFT");
    check("postedAt ถูกล้าง", r.postedAt, null);
    check("บรรทัดกลับเป็น DRAFT ด้วย (งบยังไม่เห็น)", (await prisma.accJournalLine.findMany({ where: { entryId: e.id } })).map((l) => l.status), ["DRAFT", "DRAFT"]);
    check("เลขที่ใบสำคัญเดิม", r.entryNo, e.entryNo);
    check("เรียกคืนใบที่ไม่ได้ยกเลิก = ไม่ทำอะไร", (await restoreEntry(e.id)).status, "DRAFT");

    const p = await postEntry(e.id);
    check("ผ่านรายการใหม่ได้", p.status, "POSTED");

    await voidEntry(e.id);
    await prisma.accPeriod.update({ where: { year_month: { year: YEAR, month: 1 } }, data: { status: "CLOSED" } });
    try {
      await restoreEntry(e.id);
      check("งวดปิดแล้วเรียกคืนไม่ได้", false, true);
    } catch (err) {
      check("งวดปิดแล้วเรียกคืนไม่ได้", (err as Error).message.includes("ปิดบัญชีแล้ว"), true);
    }
  } finally {
    await prisma.accJournalEntry.deleteMany({ where: { id: { in: created } } });
    await prisma.accAccount.deleteMany({ where: { code: { startsWith: P } } });
    await prisma.accPeriod.deleteMany({ where: { year: YEAR } });
  }
  console.log(fails === 0 ? "\n✅ ผ่านทั้งหมด\n" : `\n❌ ไม่ผ่าน ${fails} ข้อ\n`);
  process.exit(fails === 0 ? 0 : 1);
}
main();
