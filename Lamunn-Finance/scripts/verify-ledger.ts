/** พิสูจน์ว่าบัญชีแยกประเภทคำนวณถูก: ยอดยกมา + ยอดสะสมทีละบรรทัด + ยอดยกไป
 * และตรงกับยอดที่งบทดลองคำนวณได้จากบัญชีเดียวกัน
 *
 * สร้างข้อมูลในปี พ.ศ. 2639 (ค.ศ. 2096) แล้วลบทิ้งทั้งหมดใน finally
 * รัน: npx tsx scripts/verify-ledger.ts   (จากโฟลเดอร์ Lamunn-Finance)
 */
import { prisma } from "@lamunn/db-finance";
import { createEntry } from "../src/lib/accounting/post";
import { loadBalances, buildTrialBalance, naturalAmount } from "../src/lib/accounting/reports";
import { toSatang } from "../src/lib/accounting/money";

const P = "LEDGERTEST";
const YEAR = 2096;

let fails = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`  ${ok ? "ผ่าน  " : "ไม่ผ่าน ❌"}  ${label}${ok ? "" : `  (ได้ ${JSON.stringify(actual)} ควรเป็น ${JSON.stringify(expected)})`}`);
  if (!ok) fails++;
}
const baht = (s: number) => s / 100;

async function main() {
  const created: string[] = [];
  try {
    const cash = await prisma.accAccount.create({
      data: { code: `${P}-1110`, nameTh: "[test] เงินสด", type: "ASSET", parentCode: "1100" },
    });
    const revenue = await prisma.accAccount.create({
      data: { code: `${P}-4110`, nameTh: "[test] รายได้", type: "REVENUE", parentCode: "4000" },
    });

    // เดือน ม.ค. — เข้า 1,000 (จะกลายเป็นยอดยกมาของเดือน ก.พ.)
    // เดือน ก.พ. — เข้า 500 แล้วออก 200 : ยอดยกไปต้องเป็น 1,300
    const moves: [number, number, number][] = [
      [0, 5, 1000],
      [1, 3, 500],
      [1, 20, -200],
    ];
    for (const [m, d, amount] of moves) {
      const date = new Date(Date.UTC(YEAR, m, d));
      const e = await createEntry({
        date,
        journalType: "GENERAL",
        description: `[test] เคลื่อนไหว ${amount}`,
        status: "POSTED",
        lines:
          amount > 0
            ? [
                { accountId: cash.id, debit: amount },
                { accountId: revenue.id, credit: amount },
              ]
            : [
                { accountId: revenue.id, debit: -amount },
                { accountId: cash.id, credit: -amount },
              ],
      });
      created.push(e.id);
    }

    const febStart = new Date(Date.UTC(YEAR, 1, 1));
    const febEnd = new Date(Date.UTC(YEAR, 1, 29));

    console.log("\n=== บัญชีแยกประเภท: เงินสด เดือน ก.พ. ===");

    // จำลองคิวรีเดียวกับที่หน้าบัญชีแยกประเภทใช้
    const [openingAgg, lines] = await Promise.all([
      prisma.accJournalLine.aggregate({
        where: { accountId: cash.id, status: "POSTED", date: { lt: febStart } },
        _sum: { debit: true, credit: true },
      }),
      prisma.accJournalLine.findMany({
        where: { accountId: cash.id, status: "POSTED", date: { gte: febStart, lte: febEnd } },
        orderBy: [{ date: "asc" }, { sortOrder: "asc" }],
        select: { debit: true, credit: true, date: true },
      }),
    ]);

    const opening = toSatang(openingAgg._sum.debit) - toSatang(openingAgg._sum.credit);
    let running = opening;
    const runningRows = lines.map((l) => {
      running += toSatang(l.debit) - toSatang(l.credit);
      return running;
    });
    const totalDebit = lines.reduce((s, l) => s + toSatang(l.debit), 0);
    const totalCredit = lines.reduce((s, l) => s + toSatang(l.credit), 0);
    const closing = opening + totalDebit - totalCredit;

    check("ยอดยกมาต้นเดือน ก.พ. = 1,000 (มาจากเดือน ม.ค.)", baht(opening), 1000);
    check("มีรายการในเดือน ก.พ. 2 บรรทัด", lines.length, 2);
    check("ยอดสะสมหลังบรรทัดแรก = 1,500", baht(runningRows[0]), 1500);
    check("ยอดสะสมหลังบรรทัดที่สอง = 1,300", baht(runningRows[1]), 1300);
    check("ยอดยกไป = 1,300", baht(closing), 1300);
    check("เดบิตรวมในเดือน = 500", baht(totalDebit), 500);
    check("เครดิตรวมในเดือน = 200", baht(totalCredit), 200);

    console.log("\n=== เทียบกับงบทดลองของเดือนเดียวกัน ===");
    const balances = await loadBalances({ from: febStart, to: febEnd });
    const tb = buildTrialBalance(balances);
    const row = tb.rows.find((r) => r.code === `${P}-1110`);

    check("งบทดลอง: ยอดยกมาตรงกับแยกประเภท", baht(row?.opening ?? 0), baht(opening));
    check("งบทดลอง: เดบิตในงวดตรงกัน", baht(row?.debit ?? 0), baht(totalDebit));
    check("งบทดลอง: เครดิตในงวดตรงกัน", baht(row?.credit ?? 0), baht(totalCredit));
    check("งบทดลอง: ยอดยกไปตรงกับแยกประเภท", baht(row?.closing ?? 0), baht(closing));

    console.log("\n=== การกลับเครื่องหมายตามหมวดบัญชี ===");
    const revRow = tb.rows.find((r) => r.code === `${P}-4110`);
    // รายได้ยอดปกติอยู่ด้านเครดิต — เก็บเป็น -1,300 (เดบิตเป็นบวก) แต่ต้องแสดงเป็น +1,300
    check("รายได้: ยอดดิบเป็นลบ (เดบิตเป็นบวก)", baht(revRow?.closing ?? 0), -1300);
    check("รายได้: แสดงในงบเป็นบวก 1,300", baht(naturalAmount("REVENUE", revRow?.closing ?? 0)), 1300);
    check("สินทรัพย์: แสดงตามเดิม 1,300", baht(naturalAmount("ASSET", closing)), 1300);
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
