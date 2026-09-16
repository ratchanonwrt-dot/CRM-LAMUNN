import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { requireStaff, EDITOR_ROLES } from "@/lib/requireStaff";
import { optionalText } from "@/lib/validation";

/**
 * แอดมินกำหนดยอดจ่ายรวมของกะเอง (ผู้จัดการขึ้นไป)
 * body: { amount?: number|null, note?: string|null } — amount null = กลับไปใช้ที่ระบบคำนวณ
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const shift = await prisma.liveShift.findUnique({ where: { id: params.id } });
  if (!shift) return NextResponse.json({ error: "ไม่พบกะ" }, { status: 404 });

  const body = await req.json();
  const data: { payOverride?: number | null; payNote?: string | null } = {};
  if (body.amount !== undefined) {
    if (body.amount === null || body.amount === "") data.payOverride = null;
    else {
      const n = Number(body.amount);
      if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "ยอดจ่ายต้องเป็นตัวเลข 0 ขึ้นไป" }, { status: 400 });
      data.payOverride = Math.round(n * 100) / 100;
    }
  }
  if (body.note !== undefined) data.payNote = optionalText(body.note);

  const updated = await prisma.liveShift.update({ where: { id: params.id }, data });
  return NextResponse.json({ shift: updated });
}
