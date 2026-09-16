import Link from "next/link";
import { prisma } from "@lamunn/db-live";
import { requirePageRole } from "@/lib/requirePageRole";
import { formatBaht, formatHours, formatNum, formatThaiDateShort, slotHours, thaiMonthLabel } from "@/lib/format";
import MonthPicker from "@/components/MonthPicker";

function parseMonth(m: string | undefined): { year: number; month: number } {
  const now = new Date();
  const match = m ? /^(\d{4})-(\d{2})$/.exec(m) : null;
  if (match) return { year: Number(match[1]), month: Number(match[2]) - 1 };
  return { year: now.getFullYear(), month: now.getMonth() };
}

export default async function SessionsPage({ searchParams }: { searchParams: { month?: string } }) {
  await requirePageRole();
  const { year, month } = parseMonth(searchParams.month);
  const from = new Date(Date.UTC(year, month, 1));
  const to = new Date(Date.UTC(year, month + 1, 0));

  const sessions = await prisma.liveSession.findMany({
    where: { date: { gte: from, lte: to } },
    include: { channel: true, slots: { include: { streamer: true } }, shifts: { include: { streamer: true }, orderBy: { startTime: "asc" } } },
    orderBy: [{ date: "desc" }, { startTime: "desc" }, { createdAt: "desc" }],
  });

  const rows = sessions.map((s) => {
    const hours = s.slots.reduce((a, sl) => a + slotHours(sl.startTime, sl.endTime), 0);
    const withViewers = s.slots.filter((sl) => sl.viewers !== null);
    const vw = withViewers.reduce((a, sl) => a + (sl.viewers ?? 0) * (slotHours(sl.startTime, sl.endTime) || 0.25), 0);
    const w = withViewers.reduce((a, sl) => a + (slotHours(sl.startTime, sl.endTime) || 0.25), 0);
    const sales = s.slots.reduce((a, sl) => a + sl.sales, 0);
    const peak = s.slots.reduce<number | null>((a, sl) => {
      const pk = sl.peakViewers ?? sl.viewers;
      if (pk === null) return a;
      return a === null ? pk : Math.max(a, pk);
    }, null);
    const streamers = Array.from(new Set(s.slots.map((sl) => sl.streamer.name)));
    const pendingShifts = s.shifts.filter((sh) => !s.slots.some((sl) => sl.shiftId === sh.id));
    return { s, hours, avgViewers: w > 0 ? vw / w : 0, sales, peak, streamers, pendingShifts };
  });

  const monthHours = rows.reduce((a, r) => a + r.hours, 0);
  const monthSales = rows.reduce((a, r) => a + r.sales, 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">บันทึกรอบไลฟ์</h1>
          <p className="text-sm text-muted">{thaiMonthLabel(year, month)} · {rows.length} รอบ · {formatHours(monthHours)} · ยอดขาย {formatBaht(monthSales)} บาท</p>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker year={year} month={month} />
          <Link href="/sessions/new" className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600">
            + รอบไลฟ์ใหม่
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-paper/70 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
            <tr>
              <th className="px-3 py-2">วันที่</th>
              <th className="px-3 py-2">ช่องทาง / รอบ</th>
              <th className="px-3 py-2">เวลา</th>
              <th className="px-3 py-2">คนไลฟ์ / กะที่วางไว้</th>
              <th className="px-3 py-2 text-right">ช่วง</th>
              <th className="px-3 py-2 text-right">คนดูเฉลี่ย</th>
              <th className="px-3 py-2 text-right">สูงสุด</th>
              <th className="px-3 py-2 text-right">ยอดขาย</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ s, hours, avgViewers, sales, peak, streamers, pendingShifts }) => (
              <tr key={s.id} className="border-t border-line/60 hover:bg-paper/60">
                <td className="px-3 py-2 font-medium text-ink">{formatThaiDateShort(s.date)}</td>
                <td className="px-3 py-2">
                  <span className="text-ink">{s.channel?.name ?? "-"}</span>
                  {s.title && <span className="ml-1.5 text-xs text-stone-400">{s.title}</span>}
                </td>
                <td className="px-3 py-2 text-muted">
                  {s.startTime ?? "?"}–{s.endTime ?? "?"}
                  {hours > 0 && <span className="ml-1 text-xs text-stone-400">({formatHours(hours)})</span>}
                </td>
                <td className="px-3 py-2 text-muted">
                  {streamers.length > 0 && <span>{streamers.join(", ")}</span>}
                  {pendingShifts.length > 0 && (
                    <span className="block text-xs text-amber-700">
                      รอกรอก: {pendingShifts.map((sh) => `${sh.streamer.name} ${sh.startTime}–${sh.endTime}`).join(", ")}
                    </span>
                  )}
                  {streamers.length === 0 && pendingShifts.length === 0 && <span className="text-stone-300">ยังไม่บันทึก</span>}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-muted">{s.slots.length}</td>
                <td className="px-3 py-2 text-right tabular-nums text-ink">{avgViewers ? formatNum(avgViewers) : "-"}</td>
                <td className="px-3 py-2 text-right tabular-nums text-muted">{peak === null ? "-" : formatNum(peak)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-ink">{s.slots.length ? formatBaht(sales) : "-"}</td>
                <td className="px-3 py-2 text-right">
                  <Link href={`/sessions/${s.id}`} className="font-medium text-brand-600 hover:underline">
                    {s.slots.length ? "เปิด" : "บันทึกยอด"}
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-stone-400">
                  เดือนนี้ยังไม่มีรอบไลฟ์ — ลงกะที่{" "}
                  <Link href="/schedule" className="text-brand-600 hover:underline">
                    ตารางไลฟ์
                  </Link>{" "}
                  แล้วรอบของวันนั้นจะมาแสดงที่นี่ หรือกด &quot;+ รอบไลฟ์ใหม่&quot;
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
