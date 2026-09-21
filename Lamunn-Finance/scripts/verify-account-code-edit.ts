/** พิสูจน์ว่าการแก้รหัสบัญชีปลอดภัย: ใบสำคัญเดิมไม่หลุด และบัญชีลูกย้ายตามรหัสใหม่
 *
 * ใช้รหัสขึ้นต้น ZZCODE ซึ่งไม่ชนของจริง แล้วลบทิ้งทั้งหมดใน finally
 * รัน: npx tsx scripts/verify-account-code-edit.ts   (จากโฟลเดอร์ Lamunn-Finance)
 */
import { prisma } from "@lamunn/db-finance";
import { createEntry } from "../src/lib/accounting/post";

const P = "ZZCODE";
const YEAR = 2094;
const day = new Date(Date.UTC(YEAR, 0, 10));

let fails = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`  ${ok ? "ผ่าน  " : "ไม่ผ่าน ❌"}  ${label}${ok ? "" : `  (ได้ ${JSON.stringify(actual)} ควรเป็น ${JSON.stringify(expected)})`}`);
  if (!ok) fails++;
}

/** จำลองสิ่งที่ API ทำเวลาแก้รหัสบัญชี (ดู api/accounting/accounts/[id]/route.ts) */
async function renameCode(id: string, newCode: string) {
  const current = await prisma.accAccount.findUniqueOrThrow({ where: { id } });
  const clash = await prisma.accAccount.findUnique({ where: { code: newCode } });
  if (clash) throw new Error(`รหัส ${newCode} ถูกใช้แล้ว`);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.accAccount.update({ where: { id }, data: { code: newCode } });
    await tx.accAccount.updateMany({ where: { parentCode: current.code }, data: { parentCode: newCode } });
    return updated;
  });
}

async function main() {
  const created: string[] = [];
  try {
    const group = await prisma.accAccount.create({
      data: { code: `${P}-1100`, nameTh: "[test] กลุ่มสินทรัพย์หมุนเวียน", type: "ASSET", isPostable: false },
    });
    const child = await prisma.accAccount.create({
      data: { code: `${P}-1110`, nameTh: "[test] เงินสด", type: "ASSET", parentCode: `${P}-1100` },
    });
    const other = await prisma.accAccount.create({
      data: { code: `${P}-4110`, nameTh: "[test] รายได้", type: "REVENUE", parentCode: "4000" },
    });

    const entry = await createEntry({
      date: day,
      description: "[test] ใช้บัญชีลูก",
      status: "POSTED",
      lines: [
        { accountId: child.id, debit: 1000 },
        { accountId: other.id, credit: 1000 },
      ],
    });
    created.push(entry.id);

    console.log("\n=== แก้รหัสบัญชีแม่ (กลุ่ม) ===");
    await renameCode(group.id, `${P}-1150`);

    const childAfter = await prisma.accAccount.findUniqueOrThrow({ where: { id: child.id } });
    check("บัญชีลูกย้ายตามรหัสใหม่ของแม่", childAfter.parentCode, `${P}-1150`);

    console.log("\n=== แก้รหัสบัญชีที่ถูกใช้ในใบสำคัญแล้ว ===");
    await renameCode(child.id, `${P}-1119`);
    const lines = await prisma.accJournalLine.findMany({ where: { entryId: entry.id }, include: { account: true } });
    const line = lines.find((l) => l.accountId === child.id);
    check("บรรทัดใบสำคัญยังผูกกับบัญชีเดิม (ผูกด้วย id)", line?.accountId, child.id);
    check("บรรทัดเห็นรหัสใหม่", line?.account.code, `${P}-1119`);
    check("ยอดในบรรทัดไม่เปลี่ยน", Number(line?.debit), 1000);

    console.log("\n=== รหัสซ้ำต้องถูกปฏิเสธ ===");
    try {
      await renameCode(other.id, `${P}-1119`);
      check("ปฏิเสธรหัสที่ซ้ำกับบัญชีอื่น", false, true);
    } catch {
      check("ปฏิเสธรหัสที่ซ้ำกับบัญชีอื่น", true, true);
    }
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
