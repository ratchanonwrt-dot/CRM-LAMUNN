/** ติดตั้งข้อมูลเริ่มต้นของระบบบัญชีลงฐานข้อมูล dev — ผังบัญชีมาตรฐาน + ค่าตั้งค่าบริษัทสำหรับทดสอบ
 *
 * ใช้กับฐานข้อมูล dev ของทีมพัฒนาบัญชีเท่านั้น (รันซ้ำได้ เพิ่มเฉพาะที่ยังไม่มี ไม่ทับของเดิม)
 * รัน: npx tsx scripts/seed-dev-accounting.ts   (จากโฟลเดอร์ Lamunn-Finance โดยที่ .env ชี้ DB dev)
 */
import { prisma } from "@lamunn/db-finance";
import { DEFAULT_CHART } from "../src/lib/accounting/chartOfAccounts";

async function main() {
  const existing = await prisma.accAccount.findMany({ select: { code: true } });
  const have = new Set(existing.map((a) => a.code));
  const toCreate = DEFAULT_CHART.filter((a) => !have.has(a.code));
  if (toCreate.length > 0) {
    await prisma.accAccount.createMany({
      data: toCreate.map((a, i) => ({
        code: a.code,
        nameTh: a.nameTh,
        type: a.type,
        parentCode: a.parentCode ?? null,
        isPostable: a.isPostable !== false,
        vatRole: a.vatRole ?? null,
        sortOrder: i,
      })),
    });
  }

  // ชื่อบริษัทสมมติสำหรับ dev — ให้หัวงบ/รายงานภาษีมีข้อความครบตอนทดสอบพิมพ์
  const settings: Record<string, string> = {
    companyName: "บริษัท ทดสอบระบบบัญชี จำกัด (DEV)",
    companyTaxId: "0000000000000",
    companyAddress: "ที่อยู่สำหรับทดสอบ — ไม่ใช่ข้อมูลจริง",
    vatRate: "0.07",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  console.log(`ผังบัญชี: เพิ่ม ${toCreate.length} บัญชี (มีอยู่แล้ว ${have.size}) · ตั้งค่าบริษัท dev เรียบร้อย`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
