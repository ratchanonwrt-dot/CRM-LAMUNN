/** พิสูจน์ว่า Excel บัญชีแยกประเภทใช้ยอดยกมา/เดบิต/เครดิต/ยอดยกไปถูกต้อง
 * และเลือกส่งออกได้ทั้งบัญชีเดียวกับทุกบัญชี
 *
 * สร้างข้อมูลเฉพาะปี ค.ศ. 2098 แล้วลบด้วย id ที่สคริปต์สร้างเองใน finally
 * รัน: npx tsx scripts/verify-ledger-excel.ts
 */
import { prisma } from "@lamunn/db-finance";
import { createEntry } from "../src/lib/accounting/post";
import { buildLedgerWorkbook, loadLedgerExportData } from "../src/lib/accounting/ledgerExcel";

const YEAR = 2098;

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`  ${ok ? "ผ่าน  " : "ไม่ผ่าน ❌"}  ${label}${ok ? "" : ` (ได้ ${JSON.stringify(actual)} ควรเป็น ${JSON.stringify(expected)})`}`);
  if (!ok) failures++;
}

async function main() {
  const createdEntryIds: string[] = [];
  const createdAccountIds: string[] = [];
  const createdPeriodIds: string[] = [];
  try {
    const runId = Date.now().toString(36).toUpperCase();
    const cash = await prisma.accAccount.create({
      data: { code: `LX-${runId}-1110`, nameTh: "[test] เงินฝากธนาคาร", type: "ASSET", parentCode: "1100" },
    });
    const revenue = await prisma.accAccount.create({
      data: { code: `LX-${runId}-4110`, nameTh: "[test] รายได้", type: "REVENUE", parentCode: "4000" },
    });
    createdAccountIds.push(cash.id, revenue.id);

    // สร้างงวดล่วงหน้าเพื่อรู้ id ที่ต้องลบแน่นอน แม้การสร้างใบสำคัญภายหลังจะล้มเหลว
    for (const month of [1, 2]) {
      const existing = await prisma.accPeriod.findUnique({ where: { year_month: { year: YEAR, month } } });
      if (!existing) {
        const period = await prisma.accPeriod.create({ data: { year: YEAR, month } });
        createdPeriodIds.push(period.id);
      }
    }

    for (const [month, day, amount] of [[0, 5, 1000], [1, 3, 500], [1, 20, -200]] as const) {
      const date = new Date(Date.UTC(YEAR, month, day));
      const entry = await createEntry({
        date,
        journalType: "GENERAL",
        description: `[test] ledger export ${amount}`,
        status: "POSTED",
        lines: amount > 0
          ? [{ accountId: cash.id, debit: amount }, { accountId: revenue.id, credit: amount }]
          : [{ accountId: revenue.id, debit: -amount }, { accountId: cash.id, credit: -amount }],
      });
      createdEntryIds.push(entry.id);
    }

    const start = new Date(Date.UTC(YEAR, 1, 1));
    const end = new Date(Date.UTC(YEAR, 1, 28, 23, 59, 59, 999));
    const selected = await loadLedgerExportData({ start, end, accountId: cash.id });
    const cashData = selected[0];

    console.log("\n=== ส่งออกบัญชีเดียว ===");
    check("ได้เฉพาะบัญชีที่เลือก", selected.map((account) => account.id), [cash.id]);
    check("ยอดยกมา 1,000 บาท", cashData.opening, 100_000);
    check("มีรายการเดือน ก.พ. 2 รายการ", cashData.lines.length, 2);
    check("เดบิตรวม 500 บาท", cashData.totalDebit, 50_000);
    check("เครดิตรวม 200 บาท", cashData.totalCredit, 20_000);
    check("ยอดยกไป 1,300 บาท", cashData.closing, 130_000);
    check("ยอดสะสมแต่ละบรรทัด", cashData.lines.map((line) => line.running), [150_000, 130_000]);

    console.log("\n=== ส่งออกทุกบัญชี ===");
    const all = await loadLedgerExportData({ start, end });
    check("ทุกบัญชีมีบัญชีทดสอบทั้งสองบัญชี", [cash.id, revenue.id].every((id) => all.some((account) => account.id === id)), true);

    const workbook = buildLedgerWorkbook(selected, { companyName: "[test] Lamunn", year: YEAR, month: 2 });
    const sheet = workbook.getWorksheet("บัญชีแยกประเภท");
    check("สร้างชีตบัญชีแยกประเภท", Boolean(sheet), true);
    check("หัวไฟล์ระบุบริษัท", sheet?.getCell("A1").value, "[test] Lamunn");
    const buffer = await workbook.xlsx.writeBuffer();
    check("ไฟล์ Excel มีข้อมูล", buffer.byteLength > 0, true);
  } finally {
    console.log("\n=== ลบข้อมูลทดสอบเฉพาะ id ที่สร้าง ===");
    if (createdEntryIds.length) await prisma.accJournalEntry.deleteMany({ where: { id: { in: createdEntryIds } } });
    if (createdAccountIds.length) await prisma.accAccount.deleteMany({ where: { id: { in: createdAccountIds } } });
    if (createdPeriodIds.length) await prisma.accPeriod.deleteMany({ where: { id: { in: createdPeriodIds } } });
    console.log(`  เหลือใบสำคัญทดสอบ: ${await prisma.accJournalEntry.count({ where: { id: { in: createdEntryIds } } })}`);
  }

  console.log(failures === 0 ? "\n✅ ผ่านทั้งหมด\n" : `\n❌ ไม่ผ่าน ${failures} ข้อ\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
