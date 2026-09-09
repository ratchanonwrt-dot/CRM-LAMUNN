"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TimeSelect from "@/components/TimeSelect";
import clsx from "clsx";
import { Plus, X } from "lucide-react";
import { DAY_START_MIN, DAY_END_MIN, PREFERRED_START_MIN, minutesToLabel, streamerColor } from "@/lib/schedule";
import { formatBaht, formatHours, timeToMinutes } from "@/lib/format";

export interface GridShift {
  id: string;
  streamerId: string;
  streamerName: string;
  channelName: string | null;
  startTime: string;
  endTime: string;
  s: number; // นาที
  e: number; // นาที (อาจเกิน 1440)
  hours: number;
  sales: number;
  hasResults: boolean;
}

export interface GridDay {
  date: string; // YYYY-MM-DD
  dayLabel: string; // "จ 8 ก.ย."
  isToday: boolean;
  isPast: boolean;
  shifts: GridShift[];
  free: { s: number; e: number }[];
}

interface Option {
  id: string;
  name: string;
}

const HOUR_PX = 28;
const HOURS = Array.from({ length: (DAY_END_MIN - DAY_START_MIN) / 60 + 1 }, (_, i) => DAY_START_MIN + i * 60);
const COL_HEIGHT = ((DAY_END_MIN - DAY_START_MIN) / 60) * HOUR_PX;
const inputCls = "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white";
/** ตัวเลือกจำนวนชั่วโมง — กดทีเดียวแทนการเลื่อนหาเวลาจบ */
const HOUR_CHOICES = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8];

/** เวลาจบ = เริ่ม + ชั่วโมง — ข้ามเที่ยงคืนได้ (เช่น 22:00 + 3 ชม. = 01:00) และยังนับเป็นกะของวันเดิม */
function endFromStart(startTime: string, hours: number): { endTime: string; hours: number; crossesMidnight: boolean } {
  const s = timeToMinutes(startTime);
  if (s === null || !(hours > 0)) return { endTime: "", hours: 0, crossesMidnight: false };
  const e = s + Math.round(hours * 60);
  return { endTime: minutesToLabel(e), hours: (e - s) / 60, crossesMidnight: e > DAY_END_MIN };
}

interface FormState {
  id: string | null;
  date: string;
  streamerId: string;
  channelId: string;
  startTime: string;
  hours: string; // จำนวนชั่วโมง (ข้อความจากช่องกรอก)
  note: string;
}

export default function ScheduleGrid({
  days,
  streamers,
  channels,
  colorIndex,
}: {
  days: GridDay[];
  streamers: Option[];
  channels: Option[];
  colorIndex: Record<string, number>; // streamerId -> index สี
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openNew(date: string, startMin?: number) {
    const day = days.find((d) => d.date === date);
    // เริ่มที่จุดที่คลิก (ปัดเป็น 30 นาที) หรือช่องว่างที่ครอบ 10:00 / ช่องว่างถัดไป / ช่องว่างแรกของวัน
    let s = startMin !== undefined ? Math.floor(startMin / 30) * 30 : PREFERRED_START_MIN;
    const gap =
      day?.free.find((f) => s >= f.s && s < f.e) ??
      day?.free.find((f) => f.s >= s) ??
      day?.free[0];
    if (gap && (startMin === undefined || s < gap.s || s >= gap.e)) s = Math.max(gap.s, startMin === undefined ? Math.min(PREFERRED_START_MIN, gap.e - 60) : gap.s);
    // ค่าเริ่มต้น 3 ชม. แต่ไม่เกินช่องว่างที่เหลือ
    const maxHours = gap && gap.e < DAY_END_MIN ? (gap.e - s) / 60 : 24; // ช่องว่างท้ายวันไม่จำกัด เพราะข้ามเที่ยงคืนได้
    const hours = Math.max(0.5, Math.min(3, maxHours));
    setError(null);
    setForm({
      id: null,
      date,
      streamerId: streamers[0]?.id ?? "",
      channelId: channels[0]?.id ?? "",
      startTime: minutesToLabel(s),
      hours: String(hours),
      note: "",
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const { endTime } = endFromStart(form.startTime, Number(form.hours));
    if (!endTime) {
      setError("กรุณาเลือกเวลาเริ่มและจำนวนชั่วโมง");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: form.date, streamerId: form.streamerId, channelId: form.channelId || null, startTime: form.startTime, endTime, note: form.note }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    const body = await res.json();
    // ลงกะเสร็จ -> ไปหน้ากะทันที เพื่อกรอกคนดู/ยอดขายต่อได้เลย
    router.push(`/shifts/${body.shift.id}`);
    router.refresh();
  }

  const derived = form ? endFromStart(form.startTime, Number(form.hours)) : null;

  function onColumnClick(ev: React.MouseEvent<HTMLDivElement>, day: GridDay) {
    if ((ev.target as HTMLElement).closest("[data-shift]")) return;
    const rect = ev.currentTarget.getBoundingClientRect();
    const minutes = DAY_START_MIN + ((ev.clientY - rect.top) / HOUR_PX) * 60;
    openNew(day.date, Math.max(DAY_START_MIN, Math.min(DAY_END_MIN - 30, minutes)));
  }

  return (
    <div>
      {streamers.length === 0 && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">ยังไม่มีรายชื่อคนไลฟ์ — เพิ่มที่เมนู &quot;คนไลฟ์&quot; ก่อนจึงจะลงตารางได้</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <div className="min-w-[900px]">
          {/* หัวตาราง */}
          <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
            <div />
            {days.map((d) => (
              <div key={d.date} className={clsx("border-l border-gray-100 px-2 py-2 text-center", d.isToday && "bg-brand-50")}>
                <p className={clsx("text-sm font-semibold", d.isToday ? "text-brand-700" : "text-gray-700")}>{d.dayLabel}</p>
                <p className="text-[11px] text-gray-400">
                  {d.shifts.length ? `${d.shifts.length} กะ · ${formatHours(d.shifts.reduce((a, s) => a + s.hours, 0))}` : "ยังไม่ลงใคร"}
                </p>
              </div>
            ))}
          </div>

          {/* ตัวตาราง */}
          <div className="grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
            {/* แกนเวลา */}
            <div className="relative" style={{ height: COL_HEIGHT }}>
              {HOURS.map((h) => (
                <span key={h} className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-gray-400" style={{ top: ((h - DAY_START_MIN) / 60) * HOUR_PX }}>
                  {h === DAY_END_MIN ? "23:59" : minutesToLabel(h)}
                </span>
              ))}
            </div>
            {days.map((d) => (
              <div
                key={d.date}
                onClick={(ev) => streamers.length > 0 && onColumnClick(ev, d)}
                className={clsx("relative cursor-pointer border-l border-gray-100", d.isToday && "bg-brand-50/40", d.isPast && "bg-gray-50/60")}
                style={{ height: COL_HEIGHT }}
                title="คลิกช่องว่างเพื่อลงกะ"
              >
                {HOURS.slice(1).map((h) => (
                  <div key={h} className="absolute inset-x-0 border-t border-dashed border-gray-100" style={{ top: ((h - DAY_START_MIN) / 60) * HOUR_PX }} />
                ))}
                {d.shifts.map((s) => {
                  const top = (Math.max(s.s, DAY_START_MIN) - DAY_START_MIN) / 60 * HOUR_PX;
                  const bottom = (Math.min(s.e, DAY_END_MIN) - DAY_START_MIN) / 60 * HOUR_PX;
                  const spills = s.e > DAY_END_MIN || s.s < DAY_START_MIN;
                  return (
                    <a
                      key={s.id}
                      data-shift
                      href={`/shifts/${s.id}`}
                      className={clsx(
                        "absolute inset-x-1 overflow-hidden rounded-lg border px-1.5 py-1 text-[11px] leading-tight shadow-sm transition hover:shadow-md",
                        streamerColor(colorIndex[s.streamerId] ?? -1)
                      )}
                      style={{ top: top + 1, height: Math.max(bottom - top - 2, 18) }}
                      title={`${s.streamerName} ${s.startTime}–${s.endTime}${s.channelName ? ` · ${s.channelName}` : ""}${s.hasResults ? ` · ขาย ${formatBaht(s.sales)} ฿` : " · ยังไม่กรอกยอด"}`}
                    >
                      <p className="truncate font-semibold">{s.streamerName}</p>
                      <p className="truncate opacity-80">
                        {s.startTime}–{s.endTime}
                        {spills && " ↗"}
                      </p>
                      {bottom - top > 44 && (
                        <p className="truncate opacity-70">{s.hasResults ? `${formatBaht(s.sales)} ฿` : s.channelName ?? ""}</p>
                      )}
                    </a>
                  );
                })}
              </div>
            ))}
          </div>

          {/* ช่วงที่ยังว่าง */}
          <div className="grid border-t border-gray-200 bg-gray-50/60" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
            <div className="px-2 py-2 text-[10px] text-gray-400">ว่าง</div>
            {days.map((d) => (
              <div key={d.date} className="border-l border-gray-100 px-2 py-2">
                {d.free.length === 0 ? (
                  <p className="text-[11px] text-emerald-600">เต็มแล้ว</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {d.free.map((f) => (
                      <button
                        key={f.s}
                        onClick={() => streamers.length > 0 && openNew(d.date, f.s)}
                        className="rounded-md border border-dashed border-gray-300 bg-white px-1.5 py-0.5 text-[11px] tabular-nums text-gray-600 hover:border-brand-400 hover:text-brand-700"
                      >
                        {minutesToLabel(f.s)}–{minutesToLabel(f.e)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ตำนานสี */}
      {Object.keys(colorIndex).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {streamers
            .filter((s) => colorIndex[s.id] !== undefined)
            .map((s) => (
              <span key={s.id} className={clsx("rounded-md border px-2 py-0.5 text-[11px]", streamerColor(colorIndex[s.id]))}>
                {s.name}
              </span>
            ))}
        </div>
      )}

      <button
        onClick={() => streamers.length > 0 && openNew(days.find((d) => d.isToday)?.date ?? days[0].date)}
        disabled={streamers.length === 0}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 disabled:opacity-50"
      >
        <Plus size={16} /> ลงกะใหม่
      </button>

      {/* ฟอร์มลงกะ */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center" onClick={() => setForm(null)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">ลงกะไลฟ์</h2>
              <button type="button" onClick={() => setForm(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-500">วันที่</label>
                <select value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls}>
                  {days.map((d) => (
                    <option key={d.date} value={d.date}>
                      {d.dayLabel}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-500">คนไลฟ์</label>
                <select required value={form.streamerId} onChange={(e) => setForm({ ...form, streamerId: e.target.value })} className={inputCls}>
                  {streamers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">เวลาเริ่ม</label>
                <TimeSelect value={form.startTime} onChange={(v) => setForm({ ...form, startTime: v })} required minuteStep={30} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">ไลฟ์กี่ชั่วโมง</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0.5}
                  max={24}
                  step={0.5}
                  required
                  value={form.hours}
                  onChange={(e) => setForm({ ...form, hours: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="col-span-2">
                <div className="flex flex-wrap gap-1.5">
                  {HOUR_CHOICES.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setForm({ ...form, hours: String(h) })}
                      className={clsx(
                        "rounded-lg border px-2.5 py-1 text-xs tabular-nums",
                        Number(form.hours) === h ? "border-brand-500 bg-brand-50 font-semibold text-brand-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      {h} ชม.
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  {derived?.endTime ? (
                    <>
                      กะนี้ <span className="font-semibold tabular-nums text-gray-800">{form.startTime}–{derived.endTime}</span>
                      {derived.crossesMidnight && <span className="text-gray-400"> (ข้ามเที่ยงคืน — ยังนับเป็นกะของวันนี้)</span>}
                    </>
                  ) : (
                    "เลือกเวลาเริ่มและจำนวนชั่วโมง"
                  )}
                </p>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-500">ช่องทาง</label>
                <select value={form.channelId} onChange={(e) => setForm({ ...form, channelId: e.target.value })} className={inputCls}>
                  <option value="">ไม่ระบุ</option>
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-500">หมายเหตุ</label>
                <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={inputCls} placeholder="เช่น โปรพิเศษ, ไลฟ์คู่" />
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={saving} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
                {saving ? "กำลังบันทึก..." : "ลงกะ"}
              </button>
              <button type="button" onClick={() => setForm(null)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
