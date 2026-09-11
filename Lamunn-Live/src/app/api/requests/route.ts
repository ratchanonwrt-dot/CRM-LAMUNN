import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { requireStaff } from "@/lib/requireStaff";

/** รายการคำขอจองกะจากเว็บจอง — ?status=PENDING|APPROVED|REJECTED|ALL (ค่าเริ่มต้น PENDING) */
export async function GET(req: NextRequest) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") ?? "PENDING";
  const where = status === "ALL" ? {} : { status: status as "PENDING" | "APPROVED" | "REJECTED" };
  const requests = await prisma.slotRequest.findMany({
    where,
    include: { channel: true, streamer: true, shift: { select: { id: true } }, reviewedByStaff: { select: { name: true } } },
    orderBy: status === "PENDING" ? [{ date: "asc" }, { startTime: "asc" }] : [{ updatedAt: "desc" }],
    take: 200,
  });
  return NextResponse.json({ requests });
}
