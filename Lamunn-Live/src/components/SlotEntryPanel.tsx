"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TimeSelect from "@/components/TimeSelect";
import clsx from "clsx";
import { formatBaht, formatHours, formatNum, slotHours, timeToMinutes } from "@/lib/format";

export interface SlotData {
  id: string;
  streamerId: string;
  streamerName: string;
  startTime: string;
  endTime: string;
  viewers: number;
  peakViewers: number | null;
  sales: number;
  orders: number | null;
  note: string | null;
}

interface StreamerOpt {
  id: string;
  name: string;
  nickname: string | null;
  isActive: boolean;
}

interface FormState {
  streamerId: string;
  startTime: string;
  endTime: string;
  viewers: string;
  peakViewers: string;
  sales: string;
  orders: string;
  note: string;
}

const inputCls = "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white";

function minutesToTime(m: number): string {
  const mm = ((m % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(mm / 60)).padStart(2, "0")}:${String(mm % 60).padStart(2, "0")}`;
}

function sortSlots(slots: SlotData[]): SlotData[] {
  return [...slots].sort((a, b) => (timeToMinutes(a.startTime) ?? 0) - (timeToMinutes(b.startTime) ?? 0));
}

export default function SlotEntryPanel({
  sessionId,
  sessionStart,
  postUrl,
  defaultRange,
  defaultStreamerId,
  streamers,
  initialSlots,
}: {
  sessionId?: string; // โหมดรอบไลฟ์: โพสต์ไปที่ /api/sessions/{id}/slots
  sessionStart?: string | null;
  postUrl?: string; // โหมดกะ: โพสต์ไปที่ /api/shifts/{id}/slots
  defaultRange?: { start: string; end: string }; // เวลาเริ่ม/จบที่เติมให้ (ช่วงของกะ)
  defaultStreamerId?: string;
  streamers: StreamerOpt[];
  initialSlots: SlotData[];
}) {
  const router = useRouter();
  const [slots, setSlots] = useState<SlotData[]>(() => sortSlots(initialSlots));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function defaultsForNew(current: SlotData[]): FormState {
    const last = current[current.length - 1];
    const start = last ? last.endTime : (defaultRange?.start ?? sessionStart ?? "");
    const startMin = timeToMinutes(start);
    // ช่วงแรกของกะ = ทั้งกะ (กรอกครั้งเดียวจบ) ช่วงถัดไป = +1 ชม. จากช่วงก่อน
    const end = !last && defaultRange ? defaultRange.end : startMin === null ? "" : minutesToTime(startMin + 60);
    return {
      streamerId: last?.streamerId ?? defaultStreamerId ?? streamers.find((s) => s.isActive)?.id ?? "",
      startTime: start,
      endTime: end,
      viewers: "",
      peakViewers: "",
      sales: "",
      orders: "",
      note: "",
    };
  }

  const [form, setForm] = useState<FormState>(() => defaultsForNew(sortSlots(initialSlots)));

  const summary = useMemo(() => {
    const hours = slots.reduce((a, s) => a + slotHours(s.startTime, s.endTime), 0);
    const w = slots.reduce((a, s) => a + (slotHours(s.startTime, s.endTime) || 0.25), 0);
    const vw = slots.reduce((a, s) => a + s.viewers * (slotHours(s.startTime, s.endTime) || 0.25), 0);
    const sales = slots.reduce((a, s) => a + s.sales, 0);
    const orders = slots.reduce((a, s) => a + (s.orders ?? 0), 0);
    const peak = slots.reduce<number | null>((a, s) => {
      const pk = s.peakViewers ?? s.viewers;
      return a === null ? pk : Math.max(a, pk);
    }, null);
    const maxViewers = Math.max(0, ...slots.map((s) => s.viewers));
    return { hours, avgViewers: w > 0 ? vw / w : 0, sales, orders, peak, maxViewers };
  }, [slots]);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function startEdit(s: SlotData) {
    setEditingId(s.id);
    setError(null);
    setForm({
      streamerId: s.streamerId,
      startTime: s.startTime,
      endTime: s.endTime,
      viewers: String(s.viewers),
      peakViewers: s.peakViewers === null ? "" : String(s.peakViewers),
      sales: s.sales ? String(s.sales) : "",
      orders: s.orders === null ? "" : String(s.orders),
      note: s.note ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(defaultsForNew(slots));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      streamerId: form.streamerId,
      startTime: form.startTime,
      endTime: form.endTime,
      viewers: form.viewers,
      peakViewers: form.peakViewers,
      sales: form.sales,
      orders: form.orders,
      note: form.note,
    };
    const res = editingId
      ? await fetch(`/api/slots/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch(postUrl ?? `/api/sessions/${sessionId}/slots`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    const body = await res.json();
    const saved: SlotData = {
      id: body.slot.id,
      streamerId: body.slot.streamerId,
      streamerName: body.slot.streamer?.name ?? streamers.find((s) => s.id === body.slot.streamerId)?.name ?? "",
      startTime: body.slot.startTime,
      endTime: body.slot.endTime,
      viewers: body.slot.viewers,
      peakViewers: body.slot.peakViewers,
      sales: body.slot.sales,
      orders: body.slot.orders,
      note: body.slot.note,
    };
    const next = sortSlots(editingId ? slots.map((s) => (s.id === editingId ? saved : s)) : [...slots, saved]);
    setSlots(next);
    setEditingId(null);
    setForm(defaultsForNew(next));
    router.refresh();
  }

  async function remove(s: SlotData) {
    if (!confirm(`ลบช่วง ${s.startTime}–${s.endTime} (${s.streamerName})?`)) return;
    const res = await fetch(`/api/slots/${s.id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("ลบไม่สำเร็จ");
      return;
    }
    const next = slots.filter((x) => x.id !== s.id);
    setSlots(next);
    if (editingId === s.id) {
      setEditingId(null);
      setForm(defaultsForNew(next));
    }
    router.refresh();
  }

  const streamerLabel = (s: StreamerOpt) => (s.nickname ? `${s.name} (${s.nickname})` : s.name) + (s.isActive ? "" : " — ปิดใช้งาน");

  return (
    <div>
      {/* สรุปรอบ */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "รวมเวลาไลฟ์", value: formatHours(summary.hours) },
          { label: "คนดูเฉลี่ย", value: slots.length ? formatNum(summary.avgViewers) : "-" },
          { label: "คนดูสูงสุด", value: summary.peak === null ? "-" : formatNum(summary.peak) },
          { label: "ยอดขายรวม", value: slots.length ? `${formatBaht(summary.sales)} ฿` : "-" },
          { label: "ออเดอร์", value: summary.orders ? formatNum(summary.orders) : "-" },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-[11px] text-gray-400">{c.label}</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-gray-800">{c.value}</p>
          </div>
        ))}
      </div>

      {/* ฟอร์มกรอกช่วงเวลา */}
      <form onSubmit={submit} className={clsx("mb-5 rounded-xl border bg-white p-4", editingId ? "border-brand-300 ring-2 ring-brand-100" : "border-gray-200")}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">{editingId ? "แก้ไขช่วงเวลา" : "บันทึกช่วงเวลาใหม่"}</h2>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="text-xs text-gray-400 hover:text-gray-600">
              ยกเลิกการแก้ไข
            </button>
          )}
        </div>
        {streamers.length === 0 && (
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">ยังไม่มีรายชื่อคนไลฟ์ — ให้ผู้จัดการเพิ่มที่เมนู &quot;คนไลฟ์&quot; ก่อน</p>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500">คนไลฟ์</label>
            <select required value={form.streamerId} onChange={(e) => set("streamerId", e.target.value)} className={inputCls}>
              <option value="">เลือก...</option>
              {streamers.map((s) => (
                <option key={s.id} value={s.id}>
                  {streamerLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">เริ่ม</label>
            <TimeSelect value={form.startTime} onChange={(v) => set("startTime", v)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">ถึง</label>
            <TimeSelect value={form.endTime} onChange={(v) => set("endTime", v)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">คนดู (เฉลี่ย)</label>
            <input type="number" inputMode="numeric" min={0} required value={form.viewers} onChange={(e) => set("viewers", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">คนดูสูงสุด</label>
            <input type="number" inputMode="numeric" min={0} value={form.peakViewers} onChange={(e) => set("peakViewers", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">ยอดขาย (บาท)</label>
            <input type="number" inputMode="decimal" min={0} step="any" value={form.sales} onChange={(e) => set("sales", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">ออเดอร์</label>
            <input type="number" inputMode="numeric" min={0} value={form.orders} onChange={(e) => set("orders", e.target.value)} className={inputCls} />
          </div>
          <div className="col-span-2 sm:col-span-4 lg:col-span-6">
            <label className="mb-1 block text-xs font-medium text-gray-500">หมายเหตุ (เช่น เล่นเกมแจกของ, เน็ตหลุด, สินค้าหมด)</label>
            <input value={form.note} onChange={(e) => set("note", e.target.value)} className={inputCls} />
          </div>
          <div className="col-span-2 flex items-end">
            <button
              type="submit"
              disabled={saving || streamers.length === 0}
              className="w-full rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "+ เพิ่มช่วงนี้"}
            </button>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </form>

      {/* ตารางช่วงเวลา */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">เวลา</th>
              <th className="px-3 py-2">คนไลฟ์</th>
              <th className="px-3 py-2">คนดู</th>
              <th className="px-3 py-2 text-right">สูงสุด</th>
              <th className="px-3 py-2 text-right">ยอดขาย</th>
              <th className="px-3 py-2 text-right">ออเดอร์</th>
              <th className="px-3 py-2">หมายเหตุ</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {slots.map((s) => {
              const h = slotHours(s.startTime, s.endTime);
              const pct = summary.maxViewers > 0 ? (s.viewers / summary.maxViewers) * 100 : 0;
              return (
                <tr key={s.id} className={clsx("border-t border-gray-100", editingId === s.id && "bg-brand-50/50")}>
                  <td className="px-3 py-2 tabular-nums text-gray-800">
                    {s.startTime}–{s.endTime}
                    <span className="ml-1 text-xs text-gray-400">({formatHours(h)})</span>
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-800">{s.streamerName}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-right tabular-nums text-gray-800">{formatNum(s.viewers)}</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <span className="block h-full rounded-full bg-brand-400" style={{ width: `${pct}%` }} />
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-500">{s.peakViewers === null ? "-" : formatNum(s.peakViewers)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-800">{s.sales ? formatBaht(s.sales) : "-"}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-500">{s.orders === null ? "-" : formatNum(s.orders)}</td>
                  <td className="max-w-[200px] truncate px-3 py-2 text-xs text-gray-500" title={s.note ?? ""}>
                    {s.note ?? ""}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-3 text-xs">
                      <button onClick={() => startEdit(s)} className="font-medium text-brand-600 hover:underline">
                        แก้ไข
                      </button>
                      <button onClick={() => remove(s)} className="text-gray-400 hover:text-red-600">
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {slots.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  ยังไม่มีข้อมูล — กรอกช่วงเวลาแรกด้านบน (แนะนำแบ่งทุก 30 นาที หรือทุกครั้งที่เปลี่ยนคนไลฟ์)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
