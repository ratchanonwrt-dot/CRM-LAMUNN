"use client";

import { useState } from "react";
import clsx from "clsx";

interface Row {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  channel: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  note: string | null;
}

const STATUS: Record<Row["status"], { label: string; cls: string }> = {
  PENDING: { label: "รอทีมงานอนุมัติ", cls: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "อนุมัติแล้ว ยืนยันการไลฟ์", cls: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "ไม่อนุมัติ", cls: "bg-stone-200 text-muted" },
};

export default function StatusLookup() {
  const [phone, setPhone] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/public/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
    setBusy(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "ตรวจสอบไม่สำเร็จ");
      return;
    }
    setRows(body.requests);
  }

  return (
    <section className="rounded-2xl border border-line bg-white shadow-card p-4">
      <h2 className="font-display text-[15px] font-semibold text-ink">เช็กสถานะคำขอของฉัน</h2>
      <form onSubmit={lookup} className="mt-2 flex flex-wrap items-center gap-2">
        <input
          required
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="เบอร์โทรที่ใช้ขอจอง"
          className="w-56 rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10"
        />
        <button type="submit" disabled={busy} className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50">
          {busy ? "กำลังตรวจ..." : "ตรวจสอบ"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
      {rows && (
        <ul className="mt-3 divide-y divide-gray-100 text-sm">
          {rows.length === 0 && <li className="py-2 text-stone-400">ไม่พบคำขอของเบอร์นี้ใน 60 วันที่ผ่านมา</li>}
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="tabular-nums text-ink/80">
                {r.date} · {r.startTime}–{r.endTime}
                {r.channel && <span className="text-stone-400"> · {r.channel}</span>}
              </span>
              <span>
                <span className={clsx("rounded-full px-2 py-0.5 text-xs", STATUS[r.status].cls)}>{STATUS[r.status].label}</span>
                {r.note && <span className="ml-2 text-xs text-muted">{r.note}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
