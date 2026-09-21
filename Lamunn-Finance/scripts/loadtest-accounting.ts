/** ทดสอบความเร็วระบบบัญชีที่ปริมาณข้อมูลจริง
 *
 * ปลอดภัยกับข้อมูลจริง: ใช้ปี พ.ศ. 2641 (ค.ศ. 2098) และรหัสขึ้นต้น LOADTEST เท่านั้น
 * แล้วลบทิ้งทั้งหมดใน finally ไม่ว่าจะพังตรงไหน — แต่ก็ยังเขียนลงฐานข้อมูลจริงชั่วคราว
 * ควรรันตอนที่ไม่มีคนใช้งาน
 *
 * ยัดใบสำคัญจำนวนมากลงฐานข้อมูล (ใช้ปี 2098 ซึ่งไม่มีทางชนข้อมูลจริง) แล้วจับเวลา
 * ทุกคิวรีที่หน้าจอใช้จริง จากนั้นลบทิ้งทั้งหมดใน finally ไม่ว่าจะพังตรงไหน
 *
 * รัน: npx tsx loadtest-accounting.ts [จำนวนใบสำคัญ]
 */
import { prisma } from "@lamunn/db-finance";
import { createEntry } from "../src/lib/accounting/post";
import { loadBalances, buildTrialBalance, buildIncomeStatement, buildBalanceSheet } from "../src/lib/accounting/reports";

const N = Number(process.argv[2]) || 20000;
const YEAR = 2098;
const P = "LOADTEST";

let rtt = 0; // เวลาไป-กลับฐานข้อมูลจากเครื่องนี้ (ไทย -> Singapore) ใช้หักออกเพื่อประมาณเวลาบน Vercel

async function measure(label: string, fn: () => Promise<unknown>, queries = 1) {
  const t = Date.now();
  await fn();
  const total = Date.now() - t;
  const serverSide = Math.max(0, total - rtt * queries);
  console.log(
    `  ${String(total).padStart(6)} ms จากเครื่องนี้   ~${String(serverSide + 2 * queries).padStart(5)} ms ถ้ารันบน Vercel (สิงคโปร์)   ${label}`
  );
}

async function main() {
  console.log("=== วัดเวลาไป-กลับฐานข้อมูลพื้นฐาน ===");
  const samples: number[] = [];
  for (let i = 0; i < 5; i++) {
    const t = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    samples.push(Date.now() - t);
  }
  samples.sort((a, b) => a - b);
  rtt = samples[2];
  console.log(`  ${rtt} ms ต่อ 1 คิวรี (เครื่องนี้อยู่ไทย ฐานข้อมูลอยู่สิงคโปร์)`);
  console.log(`  บน Vercel แอปอยู่ region sin1 = สิงคโปร์เดียวกับฐานข้อมูล จะเหลือ ~1-3 ms ต่อคิวรี\n`);

  try {
    console.log("=== เตรียมผังบัญชีทดสอบ ===");
    const defs: [string, string, "ASSET" | "LIABILITY" | "REVENUE" | "EXPENSE", string][] = [
      ["1110", "เงินสด", "ASSET", "1100"],
      ["1140", "ลูกหนี้การค้า", "ASSET", "1100"],
      ["2103", "ภาษีขาย", "LIABILITY", "2100"],
      ["4110", "รายได้ขายหน้าร้าน", "REVENUE", "4000"],
      ["4120", "รายได้เดลิเวอรี", "REVENUE", "4000"],
      ["5110", "ต้นทุนขาย", "EXPENSE", "5100"],
      ["5410", "ค่าเช่า", "EXPENSE", "5400"],
      ["5420", "เงินเดือน", "EXPENSE", "5400"],
    ];
    const accounts = [];
    for (const [code, name, type, parent] of defs) {
      accounts.push(
        await prisma.accAccount.create({
          data: { code: `${P}-${code}`, nameTh: `[test] ${name}`, type, parentCode: parent },
        })
      );
    }
    const [cash, ar, vat, rev1, rev2, cogs, rent, salary] = accounts;

    console.log("\n=== ความเร็วตอนบันทึกทีละใบ (นี่คือสิ่งที่บัญชีเจอตอนกดบันทึก) ===");
    const one = new Date(Date.UTC(YEAR, 0, 5));
    const times: number[] = [];
    for (let i = 0; i < 10; i++) {
      const t = Date.now();
      await createEntry({
        date: one,
        journalType: "GENERAL",
        description: `[test] บันทึกทีละใบ ${i}`,
        status: "POSTED",
        lines: [
          { accountId: cash.id, debit: 1070 },
          { accountId: rev1.id, credit: 1000 },
          { accountId: vat.id, credit: 70 },
        ],
      });
      times.push(Date.now() - t);
    }
    times.sort((a, b) => a - b);
    const med = times[5];
    console.log(`  ${med} ms ต่อ 1 ใบ จากเครื่องนี้ (median จาก 10 ครั้ง, ช้าสุด ${times[9]} ms)`);
    console.log(`  createEntry ใช้ ~4 คิวรี -> บน Vercel จะเหลือ ~${Math.max(0, med - rtt * 4) + 8} ms`);

    console.log(`\n=== ยัดข้อมูล ${N.toLocaleString()} ใบสำคัญ (${(N * 3).toLocaleString()} บรรทัด) ===`);
    const tSeed = Date.now();
    const CHUNK = 2000;
    for (let base = 0; base < N; base += CHUNK) {
      const size = Math.min(CHUNK, N - base);
      const entries = Array.from({ length: size }, (_, k) => {
        const i = base + k;
        return {
          id: `${P}-e-${i}`,
          entryNo: `${P}-${String(i).padStart(7, "0")}`,
          date: new Date(Date.UTC(YEAR, i % 12, (i % 27) + 1)),
          journalType: (i % 3 === 0 ? "SALES" : i % 3 === 1 ? "PAYMENT" : "GENERAL") as "SALES" | "PAYMENT" | "GENERAL",
          status: "POSTED" as const,
          description: `[test] ใบสำคัญ ${i}`,
        };
      });
      await prisma.accJournalEntry.createMany({ data: entries });

      const lines = [];
      for (let k = 0; k < size; k++) {
        const i = base + k;
        const amt = 500 + (i % 4000);
        const revAcct = i % 2 === 0 ? rev1.id : rev2.id;
        const expAcct = i % 3 === 0 ? cogs.id : i % 3 === 1 ? rent.id : salary.id;
        const d = new Date(Date.UTC(YEAR, i % 12, (i % 27) + 1));
        const meta = { entryId: `${P}-e-${i}`, date: d, status: "POSTED" as const };
        if (i % 2 === 0) {
          lines.push(
            { ...meta, accountId: cash.id, debit: amt * 1.07, credit: 0, sortOrder: 0 },
            { ...meta, accountId: revAcct, debit: 0, credit: amt, sortOrder: 1 },
            { ...meta, accountId: vat.id, debit: 0, credit: amt * 0.07, sortOrder: 2 }
          );
        } else {
          lines.push(
            { ...meta, accountId: expAcct, debit: amt, credit: 0, sortOrder: 0 },
            { ...meta, accountId: ar.id, debit: 0, credit: amt, sortOrder: 1 }
          );
        }
      }
      await prisma.accJournalLine.createMany({ data: lines });
      process.stdout.write(`\r  ยัดแล้ว ${Math.min(base + CHUNK, N).toLocaleString()} / ${N.toLocaleString()}`);
    }
    const lineCount = await prisma.accJournalLine.count({ where: { entry: { entryNo: { startsWith: P } } } });
    console.log(`\r  เสร็จ ${N.toLocaleString()} ใบ / ${lineCount.toLocaleString()} บรรทัด ใน ${((Date.now() - tSeed) / 1000).toFixed(1)} วินาที\n`);

    const janStart = new Date(Date.UTC(YEAR, 0, 1));
    const janEnd = new Date(Date.UTC(YEAR, 0, 31));
    const yearEnd = new Date(Date.UTC(YEAR, 11, 31));

    console.log("=== ความเร็วหน้าจอที่ปริมาณข้อมูลนี้ ===");

    let monthBalances: Awaited<ReturnType<typeof loadBalances>> = [];
    await measure("งบทดลอง 1 เดือน (โหลดยอด 2 คิวรี + คำนวณ)", async () => {
      monthBalances = await loadBalances({ from: janStart, to: janEnd });
      buildTrialBalance(monthBalances);
    }, 3);

    await measure("งบกำไรขาดทุน (เดือนนี้ + สะสมทั้งปี = โหลด 2 ชุด)", async () => {
      const [m, y] = await Promise.all([
        loadBalances({ from: janStart, to: janEnd }),
        loadBalances({ from: janStart, to: yearEnd }),
      ]);
      buildIncomeStatement(m);
      buildIncomeStatement(y);
    }, 5);

    await measure("งบแสดงฐานะการเงิน (ยอดสะสมทั้งหมด)", async () => {
      const b = await loadBalances({ to: yearEnd });
      buildBalanceSheet(b);
    }, 2);

    await measure("สมุดรายวัน 1 เดือน (ดึงใบ+บรรทัด+ชื่อบัญชี)", () =>
      prisma.accJournalEntry.findMany({
        where: { date: { gte: janStart, lte: janEnd } },
        orderBy: [{ date: "asc" }, { entryNo: "asc" }],
        include: { lines: { include: { account: { select: { code: true, nameTh: true } } } } },
      }), 1);

    const janCount = await prisma.accJournalEntry.count({ where: { date: { gte: janStart, lte: janEnd }, entryNo: { startsWith: P } } });
    console.log(`     (เดือน ม.ค. มี ${janCount.toLocaleString()} ใบสำคัญ)`);

    await measure("สมุดรายวัน 1 เดือน แบ่งหน้า 50 ใบ (แบบที่ควรทำ)", () =>
      prisma.accJournalEntry.findMany({
        where: { date: { gte: janStart, lte: janEnd } },
        orderBy: [{ date: "asc" }, { entryNo: "asc" }],
        take: 50,
        include: { lines: { include: { account: { select: { code: true, nameTh: true } } } } },
      }), 1);

    await measure("บัญชีแยกประเภท 1 บัญชี ทั้งปี (แบบเดิม: join ตารางใบสำคัญ)", () =>
      prisma.accJournalLine.findMany({
        where: { accountId: cash.id, entry: { status: "POSTED", date: { gte: janStart, lte: yearEnd } } },
        include: { entry: { select: { entryNo: true, date: true, description: true } } },
        take: 200,
      }), 1);

    await measure("บัญชีแยกประเภท 1 บัญชี ทั้งปี (แบบใหม่: ใช้คอลัมน์ของบรรทัดเอง)", () =>
      prisma.accJournalLine.findMany({
        where: { accountId: cash.id, status: "POSTED", date: { gte: janStart, lte: yearEnd } },
        orderBy: [{ date: "asc" }],
        include: { entry: { select: { entryNo: true, description: true } } },
        take: 200,
      }), 1);

    await measure("ยอดคงเหลือของบัญชีเดียว ทั้งปี (รวมทุกบรรทัด ไม่ take)", () =>
      prisma.accJournalLine.aggregate({
        where: { accountId: cash.id, status: "POSTED", date: { gte: janStart, lte: yearEnd } },
        _sum: { debit: true, credit: true },
      }), 1);
  } finally {
    console.log("\n=== ลบข้อมูลทดสอบทั้งหมด ===");
    const delLines = await prisma.accJournalLine.deleteMany({ where: { entry: { entryNo: { startsWith: P } } } });
    const delEntries = await prisma.accJournalEntry.deleteMany({ where: { entryNo: { startsWith: P } } });
    const delDesc = await prisma.accJournalEntry.deleteMany({ where: { description: { startsWith: "[test]" } } });
    const delAcc = await prisma.accAccount.deleteMany({ where: { code: { startsWith: P } } });
    const delPeriod = await prisma.accPeriod.deleteMany({ where: { year: YEAR } });
    console.log(
      `  ลบแล้ว: บรรทัด ${delLines.count}, ใบสำคัญ ${delEntries.count + delDesc.count}, บัญชี ${delAcc.count}, งวด ${delPeriod.count}`
    );
    const left = await prisma.accJournalEntry.count();
    console.log(`  ใบสำคัญที่เหลือในระบบทั้งหมด: ${left} (ควรเป็น 0 เพราะยังไม่ได้เริ่มใช้จริง)`);
  }
}

main().then(() => process.exit(0));
