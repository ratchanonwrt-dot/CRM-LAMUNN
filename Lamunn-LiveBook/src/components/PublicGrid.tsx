"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { X } from "lucide-react";
import TimeSelect from "@/components/TimeSelect";
import { DAY_START_MIN, GRID_END_MIN, DAY_END_MIN, minutesToLabel } from "@/lib/schedule";
import { timeToMinutes } from "@/lib/format";
import type { PublicDay } from "@/lib/publicWeek";
import { PUBLIC_GAP_MINUTES, findGapViolation } from "@/lib/bookingRules";
import { toRange } from "@/lib/schedule";

const HOUR_PX = 30;
const HOURS = Array.from({ length: (GRID_END_MIN - DAY_START_MIN) / 60 + 1 }, (_, i) => DAY_START_MIN + i * 60);
const COL_HEIGHT = ((GRID_END_MIN - DAY_START_MIN) / 60) * HOUR_PX;
const HOUR_CHOICES = [1, 1.5, 2, 2.5, 3, 4, 5, 6];
const inputCls = "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10";

function endFromStart(startTime: string, hours: number): { endTime: string; crossesMidnight: boolean } {
  const s = timeToMinutes(startTime);
  if (s === null || !(hours > 0)) return { endTime: "", crossesMidnight: false };
  const e = s + Math.round(hours * 60);
  return { endTime: minutesToLabel(e), crossesMidnight: e > DAY_END_MIN };
}

interface FormState {
  date: string;
  startTime: string;
  hours: string;
  requesterName: string;
  requesterPhone: string;
  requesterLine: string;
  note: string;
  isReturning: "" | "yes" | "no"; // เคยไลฟ์กับละมุนมาก่อนไหม
  website: string; // honeypot
}

export default function PublicGrid({ days, channelId, channelName }: { days: PublicDay[]; channelId: string | null; channelName: string | null }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ date: string; startTime: string; endTime: string } | null>(null);

  function openRequest(day: PublicDay, startMin: number) {
    const gap = day.free.find((f) => startMin >= f.s && startMin < f.e) ?? day.free.find((f) => f.s >= startMin) ?? day.free[0];
    if (!gap) return;
    const s = Math.max(gap.s, Math.floor(startMin / 30) * 30);
    const maxHours = gap.e < GRID_END_MIN ? (gap.e - s) / 60 : 24;
    setError(null);
    setForm({ date: day.date, startTime: minutesToLabel(s), hours: String(Math.max(1, Math.min(3, maxHours))), requesterName: "", requesterPhone: "", requesterLine: "", note: "", isReturning: "", website: "" });
  }

  function onColumnClick(ev: React.MouseEvent<HTMLDivElement>, day: PublicDay) {
    if (day.isPast) return;
    if ((ev.target as HTMLElement).closest("[data-block]")) return;
    const rect = ev.currentTarget.getBoundingClientRect();
    const minutes = DAY_START_MIN + ((ev.clientY - rect.top) / HOUR_PX) * 60;
    openRequest(day, Math.max(DAY_START_MIN, Math.min(GRID_END_MIN - 60, minutes)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const { endTime } = endFromStart(form.startTime, Number(form.hours));
    if (!endTime) {
      setError("กรุณาเลือกเวลาเริ่มและจำนวนชั่วโมง");
      return;
    }
    if (!form.isReturning) {
      setError("กรุณาเลือกว่าเคยไลฟ์กับละมุนมาก่อนหรือไม่");
      return;
    }
    // เตือนทันทีถ้าชิดช่วงที่มีคนแล้วน้อยกว่า 30 นาที (ระบบฝั่งเซิร์ฟเวอร์เช็กซ้ำอีกชั้น)
    const day = days.find((d) => d.date === form.date);
    const range = toRange(form.startTime, endTime);
    if (day?.gapRule && range) {
      const v = findGapViolation(range, day.blocks.filter((b) => b.status !== "blocked").map((b) => ({ s: b.s, e: b.e })));
      if (v) {
        setError(v.message);
        return;
      }
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/public/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, isReturning: form.isReturning === "yes", endTime, channelId }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "ส่งคำขอไม่สำเร็จ");
      return;
    }
    setDone({ date: form.date, startTime: form.startTime, endTime });
    setForm(null);
    router.refresh();
  }

  const derived = form ? endFromStart(form.startTime, Number(form.hours)) : null;
  const dayLabel = (iso: string) => days.find((d) => d.date === iso)?.dayLabel ?? iso;

  return (
    <div>
      {done && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>
            ส่งคำขอแล้ว: {dayLabel(done.date)} {done.startTime}–{done.endTime} · ทีมงานจะติดต่อกลับทางเบอร์/LINE ที่ให้ไว้เพื่อยืนยัน
          </span>
          <button onClick={() => setDone(null)} className="text-xs text-emerald-700 underline">
            ปิด
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
        <div className="min-w-[860px]">
          <div className="grid border-b border-line" style={{ gridTemplateColumns: `52px repeat(${days.length}, 1fr)` }}>
            <div />
            {days.map((d) => (
              <div key={d.date} className={clsx("border-l border-line/60 px-2 py-2 text-center", d.isToday && "bg-brand-50")}>
                <p className={clsx("text-sm font-semibold", d.isToday ? "text-brand-700" : "text-ink/80")}>{d.dayLabel}</p>
                <p className="text-[11px] text-stone-400">{d.isPast ? "ผ่านไปแล้ว" : d.free.length ? `ว่าง ${d.free.length} ช่วง` : "เต็ม"}</p>
              </div>
            ))}
          </div>
          <div className="grid" style={{ gridTemplateColumns: `52px repeat(${days.length}, 1fr)` }}>
            <div className="relative" style={{ height: COL_HEIGHT }}>
              {HOURS.map((h) => (
                <span key={h} className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-stone-400" style={{ top: ((h - DAY_START_MIN) / 60) * HOUR_PX }}>
                  {minutesToLabel(h)}
                </span>
              ))}
            </div>
            {days.map((d) => (
              <div
                key={d.date}
                onClick={(ev) => onColumnClick(ev, d)}
                className={clsx("relative border-l border-line/60", d.isPast ? "bg-paper" : "cursor-pointer", d.isToday && !d.isPast && "bg-brand-50/30")}
                style={{ height: COL_HEIGHT }}
                title={d.isPast ? "" : "คลิกช่องว่างเพื่อขอจอง"}
              >
                {HOURS.slice(1).map((h) => (
                  <div key={h} className="absolute inset-x-0 border-t border-dashed border-line/60" style={{ top: ((h - DAY_START_MIN) / 60) * HOUR_PX }} />
                ))}
                {/* ช่องว่าง (เฉพาะวันที่ยังไม่ผ่าน) */}
                {!d.isPast &&
                  d.free.map((f) => {
                    const top = ((f.s - DAY_START_MIN) / 60) * HOUR_PX;
                    const h = ((Math.min(f.e, GRID_END_MIN) - f.s) / 60) * HOUR_PX;
                    return (
                      <button
                        key={f.s}
                        data-block
                        type="button"
                        onClick={() => openRequest(d, f.s)}
                        className="absolute inset-x-1 rounded-lg border border-dashed border-brand-400 bg-brand-50/70 text-[11px] font-medium text-brand-700 transition hover:bg-brand-100"
                        style={{ top: top + 1, height: Math.max(h - 2, 18) }}
                      >
                        ว่าง {minutesToLabel(f.s)}–{minutesToLabel(f.e)}
                      </button>
                    );
                  })}
                {d.blocks.map((b, i) => {
                  const top = ((Math.max(b.s, DAY_START_MIN) - DAY_START_MIN) / 60) * HOUR_PX;
                  const bottom = ((Math.min(b.e, GRID_END_MIN) - DAY_START_MIN) / 60) * HOUR_PX;
                  return (
                    <div
                      key={i}
                      data-block
                      className={clsx(
                        "absolute inset-x-1 overflow-hidden rounded-lg border px-1.5 py-1 text-[11px] leading-tight",
                        b.status === "booked" ? "border-line bg-stone-200 text-muted" : b.status === "blocked" ? "border-gray-900 bg-gray-900 text-white" : "border-amber-300 bg-amber-100 text-amber-800"
                      )}
                      style={{ top: top + 1, height: Math.max(bottom - top - 2, 18) }}
                      title={`${b.startTime}–${b.endTime} ${b.status === "booked" ? "มีคนไลฟ์แล้ว" : b.status === "blocked" ? "unavailable" : "มีคนขอแล้ว รออนุมัติ"}`}
                    >
                      <p className={clsx("truncate font-semibold", b.status === "blocked" && "uppercase tracking-wide")}>{b.status === "booked" ? "มีคนไลฟ์แล้ว" : b.status === "blocked" ? "unavailable" : "มีคนขอแล้ว"}</p>
                      <p className="truncate opacity-80">
                        {b.startTime}–{b.endTime}
                      </p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center" onClick={() => setForm(null)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-[15px] font-semibold text-ink">ขอจองช่วงไลฟ์</h2>
                <p className="text-xs text-stone-400">
                  {dayLabel(form.date)}
                  {channelName ? ` · ${channelName}` : ""}
                </p>
              </div>
              <button type="button" onClick={() => setForm(null)} className="text-stone-400 hover:text-muted">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">เวลาเริ่ม</label>
                <TimeSelect value={form.startTime} onChange={(v) => setForm({ ...form, startTime: v })} required minuteStep={30} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">ไลฟ์กี่ชั่วโมง</label>
                <input type="number" inputMode="decimal" min={1} max={12} step={0.5} required value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className={inputCls} />
              </div>
              <div className="col-span-2">
                <div className="flex flex-wrap gap-1.5">
                  {HOUR_CHOICES.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setForm({ ...form, hours: String(h) })}
                      className={clsx("rounded-lg border px-2.5 py-1 text-xs tabular-nums", Number(form.hours) === h ? "border-brand-500 bg-brand-50 font-semibold text-brand-700" : "border-line text-muted hover:bg-paper")}
                    >
                      {h} ชม.
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  {derived?.endTime ? (
                    <>
                      ขอช่วง <span className="font-semibold tabular-nums text-ink">{form.startTime}–{derived.endTime}</span>
                      {derived.crossesMidnight && <span className="text-stone-400"> (ข้ามเที่ยงคืน)</span>}
                    </>
                  ) : (
                    "เลือกเวลาเริ่มและจำนวนชั่วโมง"
                  )}
                </p>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted">เคยไลฟ์กับละมุนมาก่อนไหม</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: "yes", label: "เคยไลฟ์แล้ว (คนเก่า)" },
                    { v: "no", label: "ยังไม่เคย (คนใหม่)" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setForm({ ...form, isReturning: o.v as "yes" | "no" })}
                      className={clsx(
                        "rounded-lg border px-3 py-2 text-sm",
                        form.isReturning === o.v ? "border-brand-500 bg-brand-50 font-semibold text-brand-700" : "border-line text-muted hover:bg-paper"
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted">ชื่อ</label>
                <input required value={form.requesterName} onChange={(e) => setForm({ ...form, requesterName: e.target.value })} className={inputCls} placeholder="ชื่อที่ใช้ไลฟ์" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">เบอร์โทร</label>
                <input required inputMode="tel" value={form.requesterPhone} onChange={(e) => setForm({ ...form, requesterPhone: e.target.value })} className={inputCls} placeholder="08x-xxx-xxxx" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">LINE ID (ถ้ามี)</label>
                <input value={form.requesterLine} onChange={(e) => setForm({ ...form, requesterLine: e.target.value })} className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted">หมายเหตุถึงทีมงาน</label>
                <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={inputCls} placeholder="เช่น ไลฟ์สินค้าหมวดไหน / เคยไลฟ์กับเรามาแล้ว" />
              </div>
              <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="hidden" aria-hidden="true" />
            </div>
            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {days.find((d) => d.date === form.date)?.gapRule && (
              <p className="mt-3 text-[11px] text-amber-700">กติกา: ต้องเว้นอย่างน้อย {PUBLIC_GAP_MINUTES} นาทีจากช่วงที่มีคนไลฟ์/มีคนขอแล้ว ระบบกันระยะให้ในช่อง &quot;ว่าง&quot; แล้ว</p>
            )}
            <p className="mt-3 text-[11px] text-stone-400">คำขอจะยังไม่ยืนยันจนกว่าทีมงานจะอนุมัติ ช่วงนี้จะขึ้นเป็น &quot;มีคนขอแล้ว&quot; ให้คนอื่นเห็นทันที</p>
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={saving} className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
                {saving ? "กำลังส่ง..." : "ส่งคำขอจอง"}
              </button>
              <button type="button" onClick={() => setForm(null)} className="rounded-xl border border-line px-5 py-2.5 text-sm text-muted hover:bg-paper">
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
