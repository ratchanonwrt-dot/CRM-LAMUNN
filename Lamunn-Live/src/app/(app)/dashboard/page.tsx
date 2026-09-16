import Link from "next/link";
import { prisma } from "@lamunn/db-live";
import { requirePageRole } from "@/lib/requirePageRole";
import { analyze, toRows } from "@/lib/analytics";
import { formatBaht, formatHours, formatNum, formatThaiDateShort, slotHours, thaiMonthLabel } from "@/lib/format";
import BarChart from "@/components/charts/BarChart";

export default async function DashboardPage() {
  const staff = await requirePageRole();

  const nowTH = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const year = nowTH.getUTCFullYear();
  const month = nowTH.getUTCMonth();
  const from = new Date(Date.UTC(year, month, 1));
  const to = new Date(Date.UTC(year, month + 1, 0));

  const [slots, recent, streamerCount] = await Promise.all([
    prisma.liveSlot.findMany({
      where: { session: { date: { gte: from, lte: to } } },
      include: { streamer: true, session: { include: { channel: true } } },
    }),
    prisma.liveSession.findMany({
      include: { channel: true, slots: { include: { streamer: true } }, shifts: { include: { streamer: true } } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
    prisma.streamer.count({ where: { isActive: true } }),
  ]);

  const a = analyze(toRows(slots));
  const bestHour = a.byHour.filter((h) => h.slots > 0).sort((x, y) => y.avgViewers - x.avgViewers)[0];
  const topStreamer = a.byStreamer.find((s) => s.index !== null) ?? a.byStreamer[0];
  const hourIdx = a.byHour.map((h, i) => (h.slots > 0 ? i : -1)).filter((i) => i >= 0);
  const hourRange = hourIdx.length ? a.byHour.slice(Math.max(0, hourIdx[0] - 1), Math.min(24, hourIdx[hourIdx.length - 1] + 2)) : [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">สวัสดี {staff.staffName}</h1>
          <p className="text-sm text-muted">ภาพรวม{thaiMonthLabel(year, month)}</p>
        </div>
        <Link href="/sessions/new" className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600">
          + บันทึกรอบไลฟ์วันนี้
        </Link>
      </div>

      {streamerCount === 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          เริ่มต้นใช้งาน: เพิ่มรายชื่อคนไลฟ์ที่เมนู{" "}
          <Link href="/streamers" className="font-medium underline">
            คนไลฟ์
          </Link>{" "}
          ก่อน แล้วค่อยกด &quot;บันทึกรอบไลฟ์&quot;
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "รอบไลฟ์เดือนนี้", value: formatNum(a.totals.sessions), sub: `${a.totals.days} วัน · ${formatHours(a.totals.hours)}` },
          { label: "คนดูเฉลี่ย", value: a.totals.slots ? formatNum(a.totals.avgViewers) : "-", sub: a.totals.peakViewers !== null ? `สูงสุด ${formatNum(a.totals.peakViewers)}` : undefined },
          { label: "ยอดขายเดือนนี้", value: `${formatBaht(a.totals.totalSales)} ฿`, sub: a.totals.hours ? `${formatBaht(a.totals.salesPerHour)} ฿/ชม.` : undefined },
          { label: "ออเดอร์", value: a.totals.orders ? formatNum(a.totals.orders) : "-" },
          { label: "ช่วงที่คนดูเยอะสุด", value: bestHour ? bestHour.label : "-", sub: bestHour ? `เฉลี่ย ${formatNum(bestHour.avgViewers)} คน` : undefined },
          {
            label: "คนไลฟ์เด่นเดือนนี้",
            value: topStreamer?.label ?? "-",
            sub: topStreamer && topStreamer.index !== null ? `${topStreamer.index >= 1 ? "+" : ""}${Math.round((topStreamer.index - 1) * 100)}% เทียบช่วงเดียวกัน` : topStreamer ? `เฉลี่ย ${formatNum(topStreamer.avgViewers)} คน` : undefined,
          },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-line bg-white shadow-card p-3">
            <p className="text-[11px] text-stone-400">{c.label}</p>
            <p className="mt-0.5 truncate text-lg font-semibold tabular-nums text-ink">{c.value}</p>
            {c.sub && <p className="truncate text-[11px] text-stone-400">{c.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <section className="rounded-2xl border border-line bg-white shadow-card p-5 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-semibold text-ink">คนดูเฉลี่ยตามช่วงเวลา (เดือนนี้)</h2>
            <Link href="/analysis" className="text-xs font-medium text-brand-600 hover:underline">
              วิเคราะห์เต็ม →
            </Link>
          </div>
          {hourRange.length ? (
            <BarChart
              height={140}
              data={hourRange.map((h) => ({
                key: h.key,
                label: h.label.slice(0, 2),
                value: h.avgViewers,
                empty: h.slots === 0,
                hint: h.slots ? `${h.label}: คนดูเฉลี่ย ${formatNum(h.avgViewers)} · ${h.slots} ช่วง` : `${h.label}: ไม่มีข้อมูล`,
              }))}
            />
          ) : (
            <p className="py-10 text-center text-sm text-stone-400">ยังไม่มีข้อมูลเดือนนี้</p>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-white shadow-card xl:col-span-3">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="font-display text-[15px] font-semibold text-ink">รอบไลฟ์ล่าสุด</h2>
            <Link href="/sessions" className="text-xs font-medium text-brand-600 hover:underline">
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="overflow-x-auto p-2">
            <table className="w-full min-w-[520px] text-sm">
              <tbody>
                {recent.map((s) => {
                  const withViewers = s.slots.filter((sl) => sl.viewers !== null);
                  const w = withViewers.reduce((x, sl) => x + (slotHours(sl.startTime, sl.endTime) || 0.25), 0);
                  const vw = withViewers.reduce((x, sl) => x + (sl.viewers ?? 0) * (slotHours(sl.startTime, sl.endTime) || 0.25), 0);
                  const sales = s.slots.reduce((x, sl) => x + sl.sales, 0);
                  const names = Array.from(new Set(s.slots.length ? s.slots.map((sl) => sl.streamer.name) : s.shifts.map((sh) => sh.streamer.name)));
                  return (
                    <tr key={s.id} className="border-t border-line/60 first:border-t-0">
                      <td className="px-3 py-2 font-medium text-ink">{formatThaiDateShort(s.date)}</td>
                      <td className="px-3 py-2 text-muted">{s.channel?.name ?? "-"}</td>
                      <td className="px-3 py-2 text-muted">
                        {names.length ? names.join(", ") : <span className="text-stone-300">ยังไม่บันทึก</span>}
                        {!s.slots.length && s.shifts.length > 0 && <span className="ml-1 text-xs text-amber-700">(รอกรอก)</span>}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-ink">{w > 0 ? `${formatNum(vw / w)} คน` : ""}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-ink">{s.slots.length ? `${formatBaht(sales)} ฿` : ""}</td>
                      <td className="px-3 py-2 text-right">
                        <Link href={`/sessions/${s.id}`} className="text-xs font-medium text-brand-600 hover:underline">
                          {s.slots.length ? "เปิด" : "บันทึกยอด"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {recent.length === 0 && (
                  <tr>
                    <td className="px-3 py-8 text-center text-stone-400">ยังไม่มีรอบไลฟ์</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
