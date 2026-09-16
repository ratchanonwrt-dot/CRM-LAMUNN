import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@lamunn/db-live";
import { requirePageRole } from "@/lib/requirePageRole";
import { formatBaht, formatThaiDate, thaiDays } from "@/lib/format";
import SessionEditForm from "@/components/SessionEditForm";
import SlotEntryPanel from "@/components/SlotEntryPanel";
import DeleteSessionButton from "@/components/DeleteSessionButton";

export default async function SessionDetailPage({ params }: { params: { id: string } }) {
  await requirePageRole();

  const session = await prisma.liveSession.findUnique({
    where: { id: params.id },
    include: {
      channel: true,
      createdByStaff: { select: { name: true } },
      shifts: { include: { streamer: true, slots: { select: { id: true, sales: true } } }, orderBy: { startTime: "asc" } },
      slots: { include: { streamer: true }, orderBy: [{ startTime: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!session) notFound();

  const [channels, streamers] = await Promise.all([
    prisma.channel.findMany({ where: { OR: [{ isActive: true }, { id: session.channelId ?? "" }] }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.streamer.findMany({
      where: { OR: [{ isActive: true }, { id: { in: session.slots.map((s) => s.streamerId) } }] },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/sessions" className="text-sm text-stone-400 hover:text-muted">
        ← รายการรอบไลฟ์
      </Link>
      <div className="mb-5 mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            {formatThaiDate(session.date)} <span className="text-base font-medium text-stone-400">({thaiDays[session.date.getUTCDay()]})</span>
          </h1>
          <p className="text-sm text-muted">
            {session.channel?.name ?? "ไม่ระบุช่องทาง"}
            {session.title && <> · {session.title}</>}
            {(session.startTime || session.endTime) && (
              <>
                {" "}
                · {session.startTime ?? "?"}–{session.endTime ?? "?"}
              </>
            )}
            {session.createdByStaff && <span className="text-stone-400"> · สร้างโดย {session.createdByStaff.name}</span>}
          </p>
          {session.note && <p className="mt-1 text-sm text-muted">📝 {session.note}</p>}
        </div>
        <DeleteSessionButton sessionId={session.id} />
      </div>

      {session.shifts.length > 0 && (
        <section className="mb-5 rounded-2xl border border-line bg-white shadow-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-semibold text-ink">กะที่วางไว้ในรอบนี้ ({session.shifts.length})</h2>
            <Link href={`/schedule?week=${session.date.toISOString().slice(0, 10)}`} className="text-xs font-medium text-brand-600 hover:underline">
              ไปตารางไลฟ์ →
            </Link>
          </div>
          <ul className="divide-y divide-gray-100">
            {session.shifts.map((sh) => {
              const done = sh.slots.length > 0;
              const sales = sh.slots.reduce((a, x) => a + x.sales, 0);
              return (
                <li key={sh.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <span>
                    <span className="font-medium text-ink">{sh.streamer.name}</span>
                    <span className="ml-2 tabular-nums text-muted">{sh.startTime}–{sh.endTime}</span>
                    {done ? (
                      <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">กรอกแล้ว · ขาย {formatBaht(sales)} ฿</span>
                    ) : (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">ยังไม่กรอกยอด</span>
                    )}
                  </span>
                  <Link href={`/shifts/${sh.id}`} className="text-xs font-medium text-brand-600 hover:underline">
                    {done ? "เปิดกะ / แก้ยอด" : "กรอกยอดกะนี้"}
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[11px] text-stone-400">ยอดที่กรอกจากหน้ากะจะมาอยู่ในตารางช่วงเวลาด้านล่างอัตโนมัติ (แก้ได้ทั้งสองที่)</p>
        </section>
      )}

      <SlotEntryPanel
        sessionId={session.id}
        sessionStart={session.startTime}
        streamers={streamers.map((s) => ({ id: s.id, name: s.name, nickname: s.nickname, isActive: s.isActive }))}
        initialSlots={session.slots.map((s) => ({
          id: s.id,
          streamerId: s.streamerId,
          streamerName: s.streamer.name,
          startTime: s.startTime,
          endTime: s.endTime,
          viewers: s.viewers,
          peakViewers: s.peakViewers,
          sales: s.sales,
          orders: s.orders,
          note: s.note,
        }))}
      />

      <div className="mt-8">
        <SessionEditForm
          session={{
            id: session.id,
            date: session.date.toISOString().slice(0, 10),
            channelId: session.channelId,
            title: session.title,
            startTime: session.startTime,
            endTime: session.endTime,
            note: session.note,
          }}
          channels={channels.map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>
    </div>
  );
}
