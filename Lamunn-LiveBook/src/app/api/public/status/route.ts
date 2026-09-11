import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";

export const dynamic = "force-dynamic";

/** เช็กสถานะคำขอของตัวเองด้วยเบอร์โทร (เห็นเฉพาะคำขอของเบอร์นั้น) */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const phone = typeof body.phone === "string" ? body.phone.replace(/[^\d+]/g, "") : "";
  if (phone.length < 9) return NextResponse.json({ error: "กรุณากรอกเบอร์โทรให้ถูกต้อง" }, { status: 400 });

  const since = new Date(Date.now() - 60 * 86400000);
  const requests = await prisma.slotRequest.findMany({
    where: { requesterPhone: phone, createdAt: { gte: since } },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
    take: 30,
    select: { id: true, date: true, startTime: true, endTime: true, status: true, reviewNote: true, channel: { select: { name: true } }, createdAt: true },
  });
  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      date: r.date.toISOString().slice(0, 10),
      startTime: r.startTime,
      endTime: r.endTime,
      channel: r.channel?.name ?? null,
      status: r.status,
      // เหตุผลให้เห็นเฉพาะตอนถูกปฏิเสธ
      note: r.status === "REJECTED" ? r.reviewNote : null,
    })),
  });
}
