/** นำเข้ารายชื่อลูกหนี้/เจ้าหนี้จากไฟล์ Excel เข้าระบบบัญชี
 *
 *   ดูผลก่อนบันทึกจริง:  npx tsx scripts/import-partners.ts "ไฟล์.xlsx"
 *   บันทึกจริง:          npx tsx scripts/import-partners.ts "ไฟล์.xlsx" --commit
 *
 * ใช้ตัวแปลงตัวเดียวกับปุ่มนำเข้าในหน้าเว็บ (lib/accounting/partnerImport.ts)
 * ชื่อซ้ำกับของเดิม = อัปเดตข้อมูลให้ ไม่สร้างใหม่ (id เดิมคงอยู่ ใบสำคัญที่อ้างถึงจึงไม่หลุด)
 */
import ExcelJS from "exceljs";
import { prisma } from "@lamunn/db-finance";
import { mapPartnerGrid, mergeDuplicatePartners, normalizePartnerName } from "../src/lib/accounting/partnerImport";

const file = process.argv[2];
const commit = process.argv.includes("--commit");

async function readGrid(path: string): Promise<string[][]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.worksheets[0];
  const grid: string[][] = [];
  for (let r = 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const cells: string[] = [];
    for (let c = 1; c <= ws.columnCount; c++) {
      const v = row.getCell(c).value;
      let text = "";
      if (v !== null && v !== undefined) {
        if (typeof v === "object" && "text" in v) text = String((v as { text: unknown }).text);
        else if (typeof v === "object" && "result" in v) text = String((v as { result: unknown }).result ?? "");
        else text = String(v);
      }
      cells.push(text);
    }
    grid.push(cells);
  }
  return grid;
}

async function main() {
  if (!file) {
    console.error('ใช้: npx tsx scripts/import-partners.ts "ไฟล์.xlsx" [--commit]');
    process.exit(1);
  }

  const grid = await readGrid(file);
  const parsed = mapPartnerGrid(grid);
  const { skipped, mapping, headerRow } = parsed;
  const { merged: rows, mergedCount } = mergeDuplicatePartners(parsed.rows);

  console.log(`\n=== อ่านไฟล์: ${file} ===`);
  console.log(`หัวตารางอยู่แถวที่ ${headerRow} · อ่านข้อมูลได้ ${parsed.rows.length} แถว · รวมชื่อซ้ำแล้วเหลือ ${rows.length} ราย (รวมไป ${mergedCount} แถว) · ข้าม ${skipped.length} แถว`);
  console.log("\n=== จับคู่คอลัมน์ได้ดังนี้ ===");
  for (const [k, v] of Object.entries(mapping)) console.log(`  ${k.padEnd(24)} <-  ${v}`);

  const debtors = rows.filter((r) => r.type === "DEBTOR").length;
  const creditors = rows.filter((r) => r.type === "CREDITOR").length;
  const both = rows.filter((r) => r.isBoth).length;
  console.log(`\n=== ประเภท ===\n  ลูกหนี้ (ลูกค้า)      ${debtors}\n  เจ้าหนี้ (ผู้จำหน่าย) ${creditors}   ในนั้นเป็นทั้งสองอย่าง ${both} ราย`);
  console.log(`  มีเลขผู้เสียภาษี ${rows.filter((r) => r.taxId).length} · มีที่อยู่ ${rows.filter((r) => r.address).length} · มีเบอร์ ${rows.filter((r) => r.phone).length}`);

  const existing = await prisma.accPartner.findMany({ select: { id: true, name: true } });
  const byName = new Map(existing.map((p) => [normalizePartnerName(p.name), p]));
  const willUpdate = rows.filter((r) => byName.has(normalizePartnerName(r.name)));
  const willCreate = rows.length - new Set(willUpdate.map((r) => normalizePartnerName(r.name))).size;

  console.log(`\n=== เทียบกับของเดิมในระบบ (${existing.length} ราย) ===`);
  console.log(`  ชื่อตรงกับของเดิม -> อัปเดตข้อมูล ${new Set(willUpdate.map((r) => normalizePartnerName(r.name))).size} ราย`);
  console.log(`  ชื่อใหม่ -> สร้างใหม่ ${willCreate} ราย`);
  if (willUpdate.length) {
    console.log("  รายที่จะถูกอัปเดต:");
    for (const r of willUpdate.slice(0, 12)) console.log(`   - ${r.name}`);
  }

  console.log("\n=== ตัวอย่างข้อมูลที่จะบันทึก (5 รายแรก) ===");
  for (const r of rows.slice(0, 5)) {
    console.log(`  [${r.type === "DEBTOR" ? "ลูกหนี้ " : "เจ้าหนี้"}] ${r.name}`);
    console.log(`      เลขภาษี: ${r.taxId ?? "-"} · เบอร์: ${r.phone ?? "-"}`);
    console.log(`      ที่อยู่: ${(r.address ?? "-").slice(0, 90)}`);
    console.log(`      หมายเหตุ: ${(r.note ?? "-").slice(0, 90)}`);
  }
  if (skipped.length) {
    console.log("\n=== แถวที่ข้าม ===");
    for (const s of skipped.slice(0, 10)) console.log(`  แถว ${s.row}: ${s.reason}`);
  }

  if (!commit) {
    console.log("\n*** ยังไม่ได้บันทึกลงฐานข้อมูล *** — ใส่ --commit ต่อท้ายคำสั่งเพื่อบันทึกจริง\n");
    return;
  }

  console.log("\n=== กำลังบันทึก... ===");
  let created = 0;
  let updated = 0;
  for (const r of rows) {
    const key = normalizePartnerName(r.name);
    const found = byName.get(key);
    const data = { type: r.type, phone: r.phone, taxId: r.taxId, address: r.address, note: r.note };
    if (found) {
      await prisma.accPartner.update({ where: { id: found.id }, data });
      updated++;
    } else {
      const p = await prisma.accPartner.create({ data: { name: r.name, ...data } });
      byName.set(key, { id: p.id, name: r.name });
      created++;
    }
  }
  console.log(`  สร้างใหม่ ${created} ราย · อัปเดต ${updated} ราย`);
  console.log(`  รวมคู่ค้าในระบบตอนนี้: ${await prisma.accPartner.count()} ราย\n`);
}

main().then(() => process.exit(0));
