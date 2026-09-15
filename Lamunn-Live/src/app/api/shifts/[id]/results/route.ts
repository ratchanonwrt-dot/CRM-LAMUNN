import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { requireStaff, RECORDER_ROLES } from "@/lib/requireStaff";
import { normalizeTime, toInt, toFloat } from "@/lib/validation";
import { toRange } from "@/lib/schedule";
import { attachShiftToSession } from "@/lib/shiftSession";

interface RowIn {
  startTime: unknown;
  endTime: unknown;
  viewers: unknown;
  sales?: unknown;
  peakViewers?: unknown;
}

/**
 * บันทึกผลของกะแบบ "รายชั่วโมง" ทั้งชุด — แทนที่ช่วงเดิมของกะทั้งหมด
 * body: { rows: [{ startTime, endTime, viewers, sales?, peakViewers? }], orders? }
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(RECORDER_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const shift = await prisma.liveShift.findUnique({ where: { id: params.id } });
  if (!shift) return NextResponse.json({ error: "ไม่พบกะ" }, { status: 404 });

  const body = await req.json();
  const rowsIn: RowIn[] = Array.isArray(body.rows) ? body.rows : [];
  if (rowsIn.length === 0) return NextResponse.json({ error: "ไม่มีข้อมูลรายชั่วโมง" }, { status: 400 });

  const rows: { startTime: string; endTime: string; viewers: number | null; sales: number; peakViewers: number | null }[] = [];
  for (const [i, r] of rowsIn.entries()) {
    const startTime = normalizeTime(r.startTime);
    const endTime = normalizeTime(r.endTime);
    if (!startTime || !endTime || !toRange(startTime, endTime)) return NextResponse.json({ error: `ช่วงที่ ${i + 1}: เวลาไม่ถูกต้อง` }, { status: 400 });
    // คนดูเฉลี่ยไม่บังคับ — ว่างได้
    const viewersBlank = r.viewers === undefined || r.viewers === null || r.viewers === "";
    const viewers = viewersBlank ? null : toInt(r.viewers);
    if (!viewersBlank && (viewers === null || viewers < 0)) return NextResponse.json({ error: `ช่วง ${startTime}–${endTime}: คนดูเฉลี่ยต้องเป็นตัวเลข 0 ขึ้นไป` }, { status: 400 });
    const sales = toFloat(r.sales) ?? 0;
    if (sales < 0) return NextResponse.json({ error: `ช่วง ${startTime}–${endTime}: ยอดขายต้องไม่ติดลบ` }, { status: 400 });
    const peak = toInt(r.peakViewers);
    rows.push({ startTime, endTime, viewers, sales, peakViewers: peak !== null && peak >= 0 ? peak : null });
  }
  const orders = toInt(body.orders);

  const sessionId = await attachShiftToSession(shift.id, staff.staffId);

  const slots = await prisma.$transaction(async (tx) => {
    await tx.liveSlot.deleteMany({ where: { shiftId: shift.id } });
    const created = [];
    for (const [i, r] of rows.entries()) {
      created.push(
        await tx.liveSlot.create({
          data: {
            sessionId,
            shiftId: shift.id,
            streamerId: shift.streamerId,
            startTime: r.startTime,
            endTime: r.endTime,
            viewers: r.viewers,
            peakViewers: r.peakViewers,
            sales: r.sales,
            // ออเดอร์รวมของกะเก็บไว้ที่ช่วงแรก (ไม่มีข้อมูลรายชั่วโมง) — หน้าวิเคราะห์ใช้ผลรวมอยู่แล้ว
            orders: i === 0 && orders !== null && orders >= 0 ? orders : null,
          },
        })
      );
    }
    return created;
  });

  return NextResponse.json({ slots });
}
