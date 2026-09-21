/** พิสูจน์ว่า "ยกเลิกผ่านรายการ" ทำงานถูก: ใบสำคัญออกจากงบ แก้ไขได้ แล้วผ่านรายการใหม่ได้
 * และยอดกลับมาเท่าเดิมทุกบาท
 *
 * ใช้ปี พ.ศ. 2638 (ค.ศ. 2095) ซึ่งไม่ชนข้อมูลจริง แล้วลบทิ้งทั้งหมดใน finally
 * รัน: npx tsx scripts/verify-unpost.ts   (จากโฟลเดอร์ Lamunn-Finance)
 */
import { prisma } from "@lamunn/db-finance";
import { createEntry, postEntry, unpostEntry, updateEntry, AccountingError } from "../src/lib/accounting/post";
import { loadBalances, buildTrialBalance } from "../src/lib/accounting/reports";
import { toSatang } from "../src/lib/accounting/money";
import { bahtTextFromSatang } from "../src/lib/accounting/bahtText";

const P = "UNPOSTTEST";
const YEAR = 2095;
const day = new Date(Date.UTC(YEAR, 0, 10));
const start = new Date(Date.UTC(YEAR, 0, 1));
const end = new Date(Date.UTC(YEAR, 0, 31));

let fails = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`  ${ok ? "ผ่าน  " : "ไม่ผ่าน ❌"}  ${label}${ok ? "" : `  (ได้ ${JSON.stringify(actual)} ควรเป็น ${JSON.stringify(expected)})`}`);
  if (!ok) fails++;
}
const baht = (s: number) => s / 100;

/** ยอดของบัญชีหนึ่งในงบทดลองของงวด */
async function trialBalanceOf(code: string) {
  const balances = await loadBalances({ from: start, to: end });
  const tb = buildTrialBalance(balances);
  const row = tb.rows.find((r) => r.code === code);
  return { debit: baht(row?.debit ?? 0), credit: baht(row?.credit ?? 0) };
}

async function main() {
  const created: string[] = [];
  try {
    const cash = await prisma.accAccount.create({
      data: { code: `${P}-1110`, nameTh: "[test] เงินสด", type: "ASSET", parentCode: "1100" },
    });
    const rent = await prisma.accAccount.create({
      data: { code: `${P}-5410`, nameTh: "[test] ค่าเช่า", type: "EXPENSE", parentCode: "5400" },
    });

    console.log("\n=== 1. สร้างใบสำคัญแล้วผ่านรายการ ===");
    const entry = await createEntry({
      date: day,
      journalType: "PAYMENT",
      description: "[test] จ่ายค่าเช่า",
      lines: [
        { accountId: rent.id, debit: 5000 },
        { accountId: cash.id, credit: 5000 },
      ],
    });
    created.push(entry.id);
    await postEntry(entry.id);

    let e = await prisma.accJournalEntry.findUnique({ where: { id: entry.id }, include: { lines: true } });
    check("สถานะใบ = ผ่านรายการแล้ว", e?.status, "POSTED");
    check("สถานะที่บรรทัดก็เปลี่ยนตาม", e?.lines.every((l) => l.status === "POSTED"), true);
    check("เข้างบทดลองแล้ว: ค่าเช่าเดบิต 5,000", (await trialBalanceOf(`${P}-5410`)).debit, 5000);

    console.log("\n=== 2. ยกเลิกผ่านรายการ — ต้องกลับเป็นร่างและออกจากงบ ===");
    await unpostEntry(entry.id);
    e = await prisma.accJournalEntry.findUnique({ where: { id: entry.id }, include: { lines: true } });
    check("สถานะใบ = ร่าง", e?.status, "DRAFT");
    check("สถานะที่บรรทัดกลับเป็นร่างด้วย", e?.lines.every((l) => l.status === "DRAFT"), true);
    check("ล้างข้อมูลผู้ผ่านรายการแล้ว", e?.postedAt, null);
    check("ออกจากงบทดลองแล้ว: ค่าเช่าเดบิต 0", (await trialBalanceOf(`${P}-5410`)).debit, 0);
    check("บรรทัดรายการยังอยู่ครบ ไม่ได้ถูกลบ", e?.lines.length, 2);

    console.log("\n=== 3. แก้ไขตอนเป็นร่าง แล้วผ่านรายการใหม่ ===");
    await updateEntry(entry.id, {
      date: day,
      journalType: "PAYMENT",
      description: "[test] จ่ายค่าเช่า (แก้ยอดแล้ว)",
      lines: [
        { accountId: rent.id, debit: 7000 },
        { accountId: cash.id, credit: 7000 },
      ],
    });
    await postEntry(entry.id);
    e = await prisma.accJournalEntry.findUnique({ where: { id: entry.id }, include: { lines: true } });
    check("แก้คำอธิบายได้", e?.description, "[test] จ่ายค่าเช่า (แก้ยอดแล้ว)");
    check("กลับมาผ่านรายการแล้ว", e?.status, "POSTED");
    check("ยอดใหม่เข้างบ: ค่าเช่าเดบิต 7,000", (await trialBalanceOf(`${P}-5410`)).debit, 7000);
    check("ยอดในบรรทัดเป็นค่าใหม่", baht(toSatang(e?.lines.find((l) => l.accountId === rent.id)?.debit ?? 0)), 7000);

    console.log("\n=== 4. ข้อจำกัดที่ต้องมี ===");
    // งวดปิดแล้วต้องถอนการผ่านรายการไม่ได้
    await prisma.accPeriod.upsert({
      where: { year_month: { year: YEAR, month: 1 } },
      create: { year: YEAR, month: 1, status: "CLOSED" },
      update: { status: "CLOSED" },
    });
    try {
      await unpostEntry(entry.id);
      check("ปฏิเสธการถอนผ่านรายการเมื่องวดปิดแล้ว", false, true);
    } catch (err) {
      check("ปฏิเสธการถอนผ่านรายการเมื่องวดปิดแล้ว", err instanceof AccountingError, true);
    }
    await prisma.accPeriod.updateMany({ where: { year: YEAR, month: 1 }, data: { status: "OPEN" } });

    console.log("\n=== 5. จำนวนเงินเป็นตัวอักษรบนใบสำคัญ ===");
    check("7,000 -> เจ็ดพันบาทถ้วน", bahtTextFromSatang(700000), "เจ็ดพันบาทถ้วน");
    check("10,652.73 -> ตรงกับตัวอย่าง", bahtTextFromSatang(1065273), "หนึ่งหมื่นหกร้อยห้าสิบสองบาทเจ็ดสิบสามสตางค์");
  } finally {
    console.log("\n=== ลบข้อมูลทดสอบ ===");
    await prisma.accJournalEntry.deleteMany({ where: { id: { in: created } } });
    await prisma.accJournalEntry.deleteMany({ where: { description: { startsWith: "[test]" } } });
    await prisma.accAccount.deleteMany({ where: { code: { startsWith: P } } });
    await prisma.accPeriod.deleteMany({ where: { year: YEAR } });
    console.log(`  บัญชีทดสอบที่เหลือ: ${await prisma.accAccount.count({ where: { code: { startsWith: P } } })}`);
  }

  console.log(fails === 0 ? "\n✅ ผ่านทั้งหมด\n" : `\n❌ ไม่ผ่าน ${fails} ข้อ\n`);
  process.exit(fails === 0 ? 0 : 1);
}

main();
