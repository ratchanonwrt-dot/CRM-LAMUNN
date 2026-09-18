import { prisma } from "@lamunn/db-live";
import { requirePageRole } from "@/lib/requirePageRole";
import StreamerManager from "@/components/StreamerManager";

export default async function StreamersPage() {
  await requirePageRole(["SUPER_ADMIN", "MANAGER"]);
  const streamers = await prisma.streamer.findMany({
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { slots: true } } },
  });

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-semibold tracking-tight text-ink">คนไลฟ์ ({streamers.length})</h1>
      <p className="mb-6 text-sm text-muted">
        รายชื่อคนที่ขึ้นไลฟ์ — ใช้เลือกตอนบันทึกแต่ละช่วงเวลา คนที่ไม่ได้ไลฟ์แล้วให้ &quot;ปิดใช้งาน&quot; (ประวัติเก่ายังอยู่ครบ)
      </p>
      <StreamerManager
        streamers={streamers.map((s) => ({
          id: s.id,
          name: s.name,
          nickname: s.nickname,
          bankName: s.bankName,
          bankAccountNo: s.bankAccountNo,
          bankAccountName: s.bankAccountName,
          note: s.note,
          hrEmployeeId: s.hrEmployeeId,
          phone: s.phone,
          lineId: s.lineId,
          color: s.color,
          sortOrder: s.sortOrder,
          isActive: s.isActive,
          slotCount: s._count.slots,
        }))}
      />
    </div>
  );
}
