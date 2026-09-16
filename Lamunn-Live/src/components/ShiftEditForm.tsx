"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import TimeSelect from "@/components/TimeSelect";
import { toRange, minutesToLabel, DAY_END_MIN } from "@/lib/schedule";
import { timeToMinutes } from "@/lib/format";

const inputCls = "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10";
const HOUR_CHOICES = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8];

interface ShiftData {
  id: string;
  date: string;
  streamerId: string;
  channelId: string | null;
  startTime: string;
  endTime: string;
  note: string | null;
}

function endFromStart(startTime: string, hours: number): { endTime: string; crossesMidnight: boolean } {
  const s = timeToMinutes(startTime);
  if (s === null || !(hours > 0)) return { endTime: "", crossesMidnight: false };
  const e = s + Math.round(hours * 60);
  return { endTime: minutesToLabel(e), crossesMidnight: e > DAY_END_MIN };
}

/** แก้ไขกะแบบเห็นทันทีบนหน้ากะ — เวลาเลือกเป็น "เริ่ม + กี่ชั่วโมง" เหมือนตอนลงตาราง */
export default function ShiftEditForm({ shift, streamers, channels }: { shift: ShiftData; streamers: { id: string; name: string }[]; channels: { id: string; name: string }[] }) {
  const router = useRouter();
  const initialHours = (() => {
    const r = toRange(shift.startTime, shift.endTime);
    return r ? (r.e - r.s) / 60 : 3;
  })();
  const [date, setDate] = useState(shift.date);
  const [streamerId, setStreamerId] = useState(shift.streamerId);
  const [channelId, setChannelId] = useState(shift.channelId ?? "");
  const [startTime, setStartTime] = useState(shift.startTime);
  const [hours, setHours] = useState(String(initialHours));
  const [note, setNote] = useState(shift.note ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const derived = endFromStart(startTime, Number(hours));
  const dirty =
    date !== shift.date ||
    streamerId !== shift.streamerId ||
    channelId !== (shift.channelId ?? "") ||
    startTime !== shift.startTime ||
    derived.endTime !== shift.endTime ||
    note !== (shift.note ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!derived.endTime) {
      setError("กรุณาเลือกเวลาเริ่มและจำนวนชั่วโมง");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch(`/api/shifts/${shift.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, streamerId, channelId: channelId || null, startTime, endTime: derived.endTime, note }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-white shadow-card p-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">วันที่</label>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">คนไลฟ์</label>
          <select value={streamerId} onChange={(e) => setStreamerId(e.target.value)} className={inputCls}>
            {streamers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">เวลาเริ่ม</label>
          <TimeSelect value={startTime} onChange={setStartTime} required minuteStep={30} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">ไลฟ์กี่ชั่วโมง</label>
          <input type="number" inputMode="decimal" min={0.5} max={24} step={0.5} required value={hours} onChange={(e) => setHours(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">ช่องทาง</label>
          <select value={channelId} onChange={(e) => setChannelId(e.target.value)} className={inputCls}>
            <option value="">ไม่ระบุ</option>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">หมายเหตุ</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {HOUR_CHOICES.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => setHours(String(h))}
            className={clsx(
              "rounded-lg border px-2.5 py-1 text-xs tabular-nums",
              Number(hours) === h ? "border-brand-500 bg-brand-50 font-semibold text-brand-700" : "border-line text-muted hover:bg-paper"
            )}
          >
            {h} ชม.
          </button>
        ))}
        <span className="ml-2 text-xs text-muted">
          {derived.endTime ? (
            <>
              กะนี้ <span className="font-semibold tabular-nums text-ink">{startTime}–{derived.endTime}</span>
              {derived.crossesMidnight && <span className="text-stone-400"> (ข้ามเที่ยงคืน นับเป็นวันเดิม)</span>}
            </>
          ) : (
            "เลือกเวลาเริ่มและจำนวนชั่วโมง"
          )}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !dirty}
          className="rounded-xl bg-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-40 disabled:shadow-none"
        >
          {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไขกะ"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && !dirty && <p className="text-sm text-emerald-600">บันทึกแล้ว</p>}
        {dirty && !saving && <p className="text-xs text-amber-700">มีการแก้ไขที่ยังไม่ได้บันทึก</p>}
      </div>
    </form>
  );
}
