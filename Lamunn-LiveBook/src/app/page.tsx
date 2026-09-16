import Link from "next/link";
import clsx from "clsx";
import { Radio, ChevronLeft, ChevronRight } from "lucide-react";
import { loadPublicWeek } from "@/lib/publicWeek";
import { todayTH, weekStartOf, isoDate } from "@/lib/schedule";
import { formatThaiDateShort } from "@/lib/format";
import PublicGrid from "@/components/PublicGrid";
import StatusLookup from "@/components/StatusLookup";

export const dynamic = "force-dynamic";

export default async function PublicSchedulePage({ searchParams }: { searchParams: { week?: string; channel?: string } }) {
  const today = todayTH();
  const week = await loadPublicWeek(searchParams.week, searchParams.channel, today);
  const ws = new Date(week.weekStart + "T00:00:00Z");
  const we = new Date(week.weekEnd + "T00:00:00Z");
  const prev = isoDate(new Date(ws.getTime() - 7 * 86400000));
  const next = isoDate(new Date(ws.getTime() + 7 * 86400000));
  const isCurrent = week.weekStart === isoDate(weekStartOf(today));
  const q = (w: string) => `/?week=${w}${week.channelId ? `&channel=${week.channelId}` : ""}`;
  const freeCount = week.days.filter((d) => !d.isPast).reduce((a, d) => a + d.free.length, 0);

  return (
    <main className="min-h-screen">
      {/* แถบหัวเข้ม */}
      <header className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-4 py-7 md:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-300">
                <Radio size={14} strokeWidth={2.4} /> Lamunn Live
              </div>
              <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">จองช่วงไลฟ์กับ Lamunn</h1>
              <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-stone-400">
                เลือกช่วงที่ว่างแล้วส่งคำขอ ทีมงานจะติดต่อกลับเพื่อยืนยัน ตารางนี้ไม่แสดงชื่อผู้ไลฟ์
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              {week.channels.length > 1 && (
                <div className="flex items-center gap-1 rounded-full bg-white/10 p-1">
                  {week.channels.map((c) => (
                    <Link
                      key={c.id}
                      href={`/?week=${week.weekStart}&channel=${c.id}`}
                      className={clsx("rounded-full px-3.5 py-1.5 text-sm transition", c.id === week.channelId ? "bg-white font-semibold text-ink" : "text-stone-300 hover:text-white")}
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-full bg-white/10">
                  <Link href={q(prev)} className="flex h-9 w-9 items-center justify-center rounded-full text-stone-300 hover:bg-white/10 hover:text-white" aria-label="สัปดาห์ก่อน">
                    <ChevronLeft size={16} />
                  </Link>
                  <span className="min-w-[180px] text-center text-sm font-medium tabular-nums text-white">
                    {formatThaiDateShort(ws)} – {formatThaiDateShort(we)}
                  </span>
                  <Link href={q(next)} className="flex h-9 w-9 items-center justify-center rounded-full text-stone-300 hover:bg-white/10 hover:text-white" aria-label="สัปดาห์ถัดไป">
                    <ChevronRight size={16} />
                  </Link>
                </div>
                {!isCurrent && (
                  <Link href={`/${week.channelId ? `?channel=${week.channelId}` : ""}`} className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-stone-300 hover:border-white/40 hover:text-white">
                    สัปดาห์นี้
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-5 rounded border border-dashed border-brand-500 bg-brand-50" /> ว่าง กดเพื่อขอจอง
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-5 rounded bg-amber-200" /> มีคนขอแล้ว รออนุมัติ
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-5 rounded bg-stone-300" /> มีคนไลฟ์แล้ว
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-5 rounded bg-ink" /> unavailable
            </span>
          </div>
          {week.channels.length > 0 && (
            <p className="text-xs text-muted">
              สัปดาห์นี้ว่าง <span className="font-semibold text-ink">{freeCount}</span> ช่วง
            </p>
          )}
        </div>

        {week.channels.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center text-muted">ขณะนี้ยังไม่เปิดรับจองช่วงไลฟ์จากภายนอก กรุณาติดต่อทีมงาน Lamunn โดยตรง</div>
        ) : (
          <PublicGrid days={week.days} channelId={week.channelId} channelName={week.channels.find((c) => c.id === week.channelId)?.name ?? null} />
        )}

        <div className="mt-8">
          <StatusLookup />
        </div>

        <p className="mt-10 text-center text-[11px] text-stone-400">การจองจะยืนยันเมื่อทีมงาน Lamunn อนุมัติแล้วเท่านั้น</p>
      </div>
    </main>
  );
}
