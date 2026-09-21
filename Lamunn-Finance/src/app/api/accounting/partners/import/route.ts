import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { revalidateAccountingRef, ACC_PARTNERS_TAG } from "@/lib/accounting/refData";
import { fileToGrid } from "@/lib/excelImport";
import { mapPartnerGrid, mergeDuplicatePartners, normalizePartnerName } from "@/lib/accounting/partnerImport";

export const dynamic = "force-dynamic";

/** นำเข้าฐานข้อมูลลูกหนี้/เจ้าหนี้จาก Excel (.xlsx) หรือ CSV
 *
 * ตรรกะการอ่านไฟล์อยู่ใน lib/accounting/partnerImport.ts ซึ่งใช้ร่วมกับ
 * scripts/import-partners.ts (ตัวที่ใช้อัปโหลดไฟล์ก้อนใหญ่จากเครื่อง) — สองทางจึงให้ผลตรงกันเสมอ
 *
 * รองรับไฟล์ export จาก FlowAccount ตรง ๆ (ที่อยู่แยก 3 บรรทัด + คำว่า ลูกค้า/ผู้จำหน่าย)
 * ชื่อซ้ำของเดิม (ไม่สนตัวพิมพ์เล็ก-ใหญ่/เว้นวรรค) = อัปเดตข้อมูลให้ ไม่สร้างซ้ำ
 * และ id เดิมคงอยู่ ใบสำคัญที่อ้างถึงคู่ค้ารายนั้นจึงไม่หลุด
 */
export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("ACCOUNTING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 5MB" }, { status: 400 });

  let grid: string[][];
  try {
    grid = await fileToGrid(file);
  } catch {
    return NextResponse.json({ error: "อ่านไฟล์ไม่ได้ — รองรับ .xlsx และ .csv" }, { status: 400 });
  }
  if (grid.length === 0) return NextResponse.json({ error: "ไฟล์ว่างเปล่า" }, { status: 400 });

  const parsed = mapPartnerGrid(grid);
  if (parsed.headerRow === -1) {
    return NextResponse.json({ error: "หาแถวหัวตารางไม่เจอ — ไฟล์ต้องมีคอลัมน์ชื่อ" }, { status: 400 });
  }

  // รวมชื่อที่ซ้ำกันเองในไฟล์ก่อน ไม่งั้นแถวหลังจะทับข้อมูลของแถวก่อนหน้าไปเปล่า ๆ
  const { merged, mergedCount } = mergeDuplicatePartners(parsed.rows);

  const existing = await prisma.accPartner.findMany({ select: { id: true, name: true } });
  const byName = new Map(existing.map((p) => [normalizePartnerName(p.name), p]));

  let created = 0;
  let updated = 0;

  for (const row of merged) {
    const key = normalizePartnerName(row.name);
    const data = { type: row.type, phone: row.phone, taxId: row.taxId, address: row.address, note: row.note };
    const found = byName.get(key);
    if (found) {
      await prisma.accPartner.update({ where: { id: found.id }, data });
      updated++;
    } else {
      const partner = await prisma.accPartner.create({ data: { name: row.name, ...data } });
      byName.set(key, { id: partner.id, name: row.name });
      created++;
    }
  }

  revalidateAccountingRef(ACC_PARTNERS_TAG);
  return NextResponse.json({
    created,
    updated,
    mergedInFile: mergedCount,
    mapping: parsed.mapping,
    skipped: parsed.skipped.slice(0, 30),
    skippedCount: parsed.skipped.length,
  });
}
