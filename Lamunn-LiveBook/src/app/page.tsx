import Link from "next/link";
import { Radio } from "lucide-react";
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-900/20">
            <Radio size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">ตารางไลฟ์ Lamunn — จองช่วงไลฟ์</h1>
            <p className="text-sm text-gray-500">ดูว่าช่วงไหนว่าง แล้วกดขอจองได้เลย ทีมงานจะติดต่อกลับเพื่อยืนยัน</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {week.channels.length > 1 && (
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1">
              {week.channels.map((c) => (
                <Link
                  key={c.id}
                  href={`/?week=${week.weekStart}&channel=${c.id}`}
                  className={`rounded-lg px-3 py-1.5 text-sm ${c.id === week.channelId ? "bg-brand-600 font-medium text-white" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}
          <div className="flex items-center rounded-xl border border-gray-200 bg-white">
            <Link href={q(prev)} className="px-3 py-2 text-gray-500 hover:bg-gray-50" aria-label="สัปดาห์ก่อน">
              ‹
            </Link>
            <span className="min-w-[190px] text-center text-sm font-medium text-gray-700">
              {formatThaiDateShort(ws)} – {formatThaiDateShort(we)}
            </span>
            <Link href={q(next)} className="px-3 py-2 text-gray-500 hover:bg-gray-50" aria-label="สัปดาห์ถัดไป">
              ›
            </Link>
          </div>
          {!isCurrent && (
            <Link href={`/${week.channelId ? `?channel=${week.channelId}` : ""}`} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
              สัปดาห์นี้
            </Link>
          )}
        </div>
      </header>

      <div className="mb-3 flex flex-wrap gap-3 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-5 rounded border border-dashed border-brand-400 bg-brand-50" /> ว่าง กดเพื่อขอจอง
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-5 rounded border border-amber-300 bg-amber-100" /> มีคนขอแล้ว รอทีมงานอนุมัติ
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-5 rounded border border-gray-300 bg-gray-200" /> มีคนไลฟ์แล้ว
        </span>
      </div>

      <PublicGrid days={week.days} channelId={week.channelId} channelName={week.channels.find((c) => c.id === week.channelId)?.name ?? null} />

      <div className="mt-8">
        <StatusLookup />
      </div>

      <p className="mt-8 text-center text-[11px] text-gray-400">ตารางนี้ไม่แสดงชื่อผู้ไลฟ์ · การจองจะยืนยันเมื่อทีมงาน Lamunn อนุมัติแล้วเท่านั้น</p>
    </main>
  );
}
