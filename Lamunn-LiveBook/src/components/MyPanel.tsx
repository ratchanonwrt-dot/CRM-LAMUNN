"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { UserRound, LogOut } from "lucide-react";

export interface MyRow {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  channel: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  note: string | null;
  editable: boolean;
}

const STATUS: Record<MyRow["status"], { label: string; cls: string }> = {
  PENDING: { label: "รอทีมงานอนุมัติ", cls: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "อนุมัติแล้ว ยืนยันการไลฟ์", cls: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "ไม่อนุมัติ", cls: "bg-stone-200 text-muted" },
  CANCELLED: { label: "ยกเลิกแล้ว", cls: "bg-stone-200 text-muted" },
};

const inputCls = "rounded-xl border border-line bg-white px-3 py-2.5 text-base text-ink outline-none md:text-sm transition focus:border-ink focus:ring-2 focus:ring-ink/10";

/** แผง "ของฉัน": ใส่เบอร์ครั้งเดียว ระบบจำไว้ แล้วเห็น/จัดการช่วงของตัวเอง */
export default function MyPanel({ phoneMasked, onManage }: { phoneMasked: string | null; onManage: (row: MyRow) => void }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [rows, setRows] = useState<MyRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!phoneMasked) return;
    fetch("/api/public/my")
      .then((r) => r.json())
      .then((b) => setRows(b.requests ?? []))
      .catch(() => setRows([]));
  }, [phoneMasked]);

  async function remember(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/public/me", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
    setBusy(false);
    const b = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(b.error ?? "ไม่สำเร็จ");
      return;
    }
    router.refresh();
  }

  async function forget() {
    await fetch("/api/public/me", { method: "DELETE" });
    setRows(null);
    router.refresh();
  }

  if (!phoneMasked) {
    return (
      <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
        <div className="flex items-center gap-2">
          <UserRound size={16} className="text-brand-600" />
          <h2 className="font-display text-[15px] font-semibold text-ink">ช่วงของฉัน</h2>
        </div>
        <p className="mt-1 text-xs text-muted">ใส่เบอร์โทรที่ใช้ขอจอง ระบบจะไฮไลต์ช่วงของคุณบนตาราง และให้แก้เวลา/ยกเลิกช่วงของคุณเองได้</p>
        <form onSubmit={remember} className="mt-3 flex flex-wrap items-center gap-2">
          <input required inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="เบอร์โทรของคุณ" className={inputCls + " w-full sm:w-56"} />
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50 sm:w-auto">
            {busy ? "กำลังตรวจ..." : "ดูช่วงของฉัน"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <UserRound size={16} className="text-brand-600" />
          <h2 className="font-display text-[15px] font-semibold text-ink">ช่วงของฉัน</h2>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs tabular-nums text-brand-800">{phoneMasked}</span>
        </div>
        <button onClick={forget} className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
          <LogOut size={13} /> ไม่ใช่ฉัน / ลืมเบอร์นี้
        </button>
      </div>
      <p className="mt-1 text-xs text-muted">ช่วงของคุณบนตารางมีกรอบเขียวเข้มและป้าย &quot;ของฉัน&quot; — กดที่ช่วงเพื่อแก้เวลาหรือยกเลิก</p>
      {rows === null ? (
        <p className="mt-3 text-sm text-stone-400">กำลังโหลด...</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-stone-400">ยังไม่มีคำขอของเบอร์นี้ — กดช่วง &quot;ว่าง&quot; บนตารางเพื่อขอจอง</p>
      ) : (
        <ul className="mt-3 divide-y divide-line/60 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="tabular-nums text-ink/80">
                {r.date} · {r.startTime}–{r.endTime}
                {r.channel && <span className="text-stone-400"> · {r.channel}</span>}
              </span>
              <span className="flex items-center gap-2">
                <span className={clsx("rounded-full px-2 py-0.5 text-xs", STATUS[r.status].cls)}>{STATUS[r.status].label}</span>
                {r.note && <span className="text-xs text-muted">{r.note}</span>}
                {r.editable && (
                  <button onClick={() => onManage(r)} className="text-xs font-medium text-brand-700 hover:underline">
                    แก้ไข / ยกเลิก
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
