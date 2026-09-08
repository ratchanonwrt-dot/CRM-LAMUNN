import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@lamunn/db-live";
import { requirePageRole } from "@/lib/requirePageRole";
import { formatThaiDate, thaiDays } from "@/lib/format";
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
      <Link href="/sessions" className="text-sm text-gray-400 hover:text-gray-600">
        ← รายการรอบไลฟ์
      </Link>
      <div className="mb-5 mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            {formatThaiDate(session.date)} <span className="text-base font-medium text-gray-400">({thaiDays[session.date.getUTCDay()]})</span>
          </h1>
          <p className="text-sm text-gray-500">
            {session.channel?.name ?? "ไม่ระบุช่องทาง"}
            {session.title && <> · {session.title}</>}
            {(session.startTime || session.endTime) && (
              <>
                {" "}
                · {session.startTime ?? "?"}–{session.endTime ?? "?"}
              </>
            )}
            {session.createdByStaff && <span className="text-gray-400"> · สร้างโดย {session.createdByStaff.name}</span>}
          </p>
          {session.note && <p className="mt-1 text-sm text-gray-500">📝 {session.note}</p>}
        </div>
        <DeleteSessionButton sessionId={session.id} />
      </div>

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
