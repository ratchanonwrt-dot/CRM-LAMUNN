import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { revalidateAccountingRef, ACC_ACCOUNTS_TAG } from "@/lib/accounting/refData";
import { fileToGrid } from "@/lib/excelImport";

export const dynamic = "force-dynamic";

// นำเข้าผังบัญชีจากไฟล์ Excel (.xlsx) หรือ CSV
// รูปแบบยืดหยุ่น: หาแถวหัวตารางที่มีคำว่า รหัส/code + ชื่อ/name เอง ถ้าไม่มีหัวตารางจะถือว่า
// คอลัมน์แรก = รหัสบัญชี คอลัมน์สอง = ชื่อบัญชี
// หมวดบัญชีถ้าไม่ระบุ เดาจากเลขตัวแรกของรหัส (1 สินทรัพย์ ... 5 ค่าใช้จ่าย) ตามมาตรฐานผังบัญชีไทย
// รหัสที่มีอยู่แล้ว = อัพเดตชื่อ (ไม่แตะ type/การใช้งานเดิม กันงบย้อนหลังเพี้ยน), รหัสใหม่ = สร้างเพิ่ม

const TYPE_BY_DIGIT: Record<string, string> = {
  "1": "ASSET",
  "2": "LIABILITY",
  "3": "EQUITY",
  "4": "REVENUE",
  "5": "EXPENSE",
};

function typeFromText(t: string): string | null {
  const s = t.trim().toLowerCase();
  if (!s) return null;
  if (/^(asset|สินทรัพย์)/.test(s) || s.includes("สินทรัพย์")) return "ASSET";
  if (/^liabilit/.test(s) || s.includes("หนี้สิน")) return "LIABILITY";
  if (/^equity/.test(s) || s.includes("ทุน") || s.includes("ผู้ถือหุ้น") || s.includes("ส่วนของ")) return "EQUITY";
  if (/^revenue|^income/.test(s) || s.includes("รายได้") || s.includes("รายรับ")) return "REVENUE";
  if (/^expense|^cost/.test(s) || s.includes("ค่าใช้จ่าย") || s.includes("ต้นทุน") || s.includes("รายจ่าย")) return "EXPENSE";
  return null;
}

function vatFromText(t: string): string | null {
  const s = t.trim().toLowerCase();
  if (!s) return null;
  if (s.includes("ภาษีขาย") || s === "output") return "OUTPUT";
  if (s.includes("ภาษีซื้อ") || s === "input") return "INPUT";
  if (s.includes("หัก ณ ที่จ่าย") || s === "wht") return "WHT";
  return null;
}

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

  // หาแถวหัวตารางใน 10 แถวแรก
  let codeCol = 0;
  let nameCol = 1;
  let typeCol = -1;
  let parentCol = -1;
  let vatCol = -1;
  let dataStart = 0;
  for (let r = 0; r < Math.min(grid.length, 10); r++) {
    const row = grid[r].map((c) => c.toLowerCase());
    const ci = row.findIndex((c) => /รหัส|^code|เลขที่บัญชี/.test(c));
    const ni = row.findIndex((c) => /ชื่อ|^name|^account name/.test(c));
    if (ci !== -1 && ni !== -1) {
      codeCol = ci;
      nameCol = ni;
      typeCol = row.findIndex((c) => /หมวด|ประเภท|^type|^category/.test(c));
      parentCol = row.findIndex((c) => /แม่|^parent/.test(c));
      vatCol = row.findIndex((c) => /vat|ภาษี/.test(c));
      dataStart = r + 1;
      break;
    }
  }

  let created = 0;
  let updated = 0;
  const skipped: { row: number; reason: string }[] = [];

  const existing = await prisma.accAccount.findMany({ select: { id: true, code: true, nameTh: true } });
  const byCode = new Map(existing.map((a) => [a.code, a]));

  for (let r = dataStart; r < grid.length; r++) {
    const cells = grid[r];
    if (cells.every((c) => !c)) continue; // แถวว่าง

    let code = (cells[codeCol] ?? "").replace(/\.0$/, "").trim();
    const nameTh = (cells[nameCol] ?? "").trim();
    if (!code && !nameTh) continue;
    if (!/^[0-9][0-9A-Za-z.\-]{1,9}$/.test(code)) {
      skipped.push({ row: r + 1, reason: `รหัส "${code || "-"}" ไม่ใช่รหัสบัญชี` });
      continue;
    }
    if (!nameTh) {
      skipped.push({ row: r + 1, reason: `รหัส ${code} ไม่มีชื่อบัญชี` });
      continue;
    }

    const found = byCode.get(code);
    if (found) {
      if (found.nameTh !== nameTh) {
        await prisma.accAccount.update({ where: { id: found.id }, data: { nameTh } });
        updated++;
      }
      continue;
    }

    const type = (typeCol !== -1 ? typeFromText(cells[typeCol] ?? "") : null) ?? TYPE_BY_DIGIT[code[0]] ?? null;
    if (!type) {
      skipped.push({ row: r + 1, reason: `รหัส ${code} เดาหมวดไม่ได้ (ตัวแรกต้องเป็นเลข 1-5 หรือระบุคอลัมน์หมวด)` });
      continue;
    }
    const vatRole = vatCol !== -1 ? vatFromText(cells[vatCol] ?? "") : null;
    const parentCode = parentCol !== -1 && cells[parentCol]?.trim() ? cells[parentCol].trim() : null;

    const acc = await prisma.accAccount.create({
      data: { code, nameTh, type: type as never, parentCode, vatRole: vatRole as never, isPostable: true },
    });
    byCode.set(code, { id: acc.id, code, nameTh });
    created++;
  }

  revalidateAccountingRef(ACC_ACCOUNTS_TAG);
  return NextResponse.json({ created, updated, skipped: skipped.slice(0, 30), skippedCount: skipped.length });
}
