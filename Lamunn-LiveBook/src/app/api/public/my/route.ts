import { NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { phoneFromCookies, maskPhone } from "@/lib/me";
import { todayTH } from "@/lib/schedule";
import { EDIT_LEAD_HOURS, startsWithin } from "@/lib/bookingRules";

export const dynamic = "force-dynamic";

/** ช่วงทั้งหมดของเบอร์ที่จำไว้ (60 วันล่าสุด + อนาคต) พร้อมบอกว่าแก้/ยกเลิกได้ไหม */
export async function GET() {
  const phone = phoneFromCookies();
  if (!phone) return NextResponse.json({ phone: null, requests: [] });
  const since = new Date(Date.now() - 60 * 86400000);
  const today = todayTH();
  const rows = await prisma.slotRequest.findMany({
    where: { requesterPhone: phone, OR: [{ createdAt: { gte: since } }, { date: { gte: today } }] },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take: 50,
    include: { channel: { select: { name: true } }, shift: { select: { id: true, startTime: true, endTime: true, slots: { select: { id: true } } } } },
  });
  // กะที่มีคำขอเปลี่ยนเวลาค้างอยู่ (เพื่อบอกในแถวของกะเดิม)
  const pendingChangeFor = new Set(rows.filter((r) => r.status === "PENDING" && r.replacesShiftId).map((r) => r.replacesShiftId!));
  return NextResponse.json({
    phone: maskPhone(phone),
    requests: rows.map((r) => {
      const startTime = r.shift?.startTime ?? r.startTime;
      const endTime = r.shift?.endTime ?? r.endTime;
      const active = r.status === "PENDING" || (r.status === "APPROVED" && !!r.shift);
      const editable = active && r.date >= today && !startsWithin(r.date, startTime, EDIT_LEAD_HOURS) && !(r.shift && r.shift.slots.length > 0);
      return {
        id: r.id,
        date: r.date.toISOString().slice(0, 10),
        startTime,
        endTime,
        channel: r.channel?.name ?? null,
        status: r.status,
        isChange: r.status === "PENDING" && !!r.replacesShiftId,
        hasPendingChange: r.status === "APPROVED" && !!r.shiftId && pendingChangeFor.has(r.shiftId),
        note: r.status === "REJECTED" ? r.reviewNote : null,
        editable,
      };
    }),
  });
}
