"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useCanEdit } from "@/lib/RoleContext";
import { formatThaiDateShort, thaiDays } from "@/lib/format";

type Status = "PENDING" | "APPROVED" | "REJECTED";

interface RequestRow {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  channelName: string | null;
  requesterName: string;
  requesterPhone: string;
  requesterLine: string | null;
  note: string | null;
  status: Status;
  streamerName: string | null;
  shiftId: string | null;
  reviewNote: string | null;
  reviewedBy: string | null;
  createdAt: string;
}

interface StreamerOpt {
  id: string;
  name: string;
  phone: string | null;
  lineId: string | null;
}

const digits = (s: string | null | undefined) => (s ?? "").replace(/[^\d]/g, "");
const inputCls = "rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white";

function RequestCard({ r, streamers, onChanged }: { r: RequestRow; streamers: StreamerOpt[]; onChanged: () => void }) {
  const canEdit = useCanEdit();
  // จับคู่คนไลฟ์จากเบอร์โทร (เทียบเฉพาะตัวเลข) หรือ LINE ID
  const matched = streamers.find((s) => (digits(s.phone) && digits(s.phone) === digits(r.requesterPhone)) || (s.lineId && r.requesterLine && s.lineId.toLowerCase() === r.requesterLine.toLowerCase()));
  const [mode, setMode] = useState<"pick" | "create">(matched ? "pick" : "create");
  const [streamerId, setStreamerId] = useState(matched?.id ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const d = new Date(r.date + "T00:00:00Z");

  async function act(action: "approve" | "reject") {
    if (action === "reject" && !confirm(`ปฏิเสธคำขอของ ${r.requesterName}?`)) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/requests/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action === "approve" ? { action, streamerId: mode === "pick" ? streamerId : null, createStreamer: mode === "create", note } : { action, note }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "ทำรายการไม่สำเร็จ");
      return;
    }
    onChanged();
  }

  return (
    <li className={clsx("rounded-xl border bg-white p-4", r.status === "PENDING" ? "border-amber-200" : "border-gray-200")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {formatThaiDateShort(d)} ({thaiDays[d.getUTCDay()]}) <span className="tabular-nums">{r.startTime}–{r.endTime}</span>
            {r.channelName && <span className="ml-2 font-normal text-gray-500">· {r.channelName}</span>}
          </p>
          <p className="mt-1 text-sm text-gray-700">
            {r.requesterName} <span className="tabular-nums text-gray-500">📞 {r.requesterPhone}</span>
            {r.requesterLine && <span className="text-gray-500"> · LINE: {r.requesterLine}</span>}
          </p>
          {r.note && <p className="mt-1 text-xs text-gray-500">📝 {r.note}</p>}
          <p className="mt-1 text-[11px] text-gray-400">ส่งเมื่อ {new Date(r.createdAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "short", timeStyle: "short" })}</p>
        </div>
        <div className="text-right">
          {r.status === "APPROVED" && (
            <div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">อนุมัติแล้ว → {r.streamerName}</span>
              {r.shiftId && (
                <Link href={`/shifts/${r.shiftId}`} className="mt-1 block text-xs font-medium text-brand-600 hover:underline">
                  เปิดกะ →
                </Link>
              )}
            </div>
          )}
          {r.status === "REJECTED" && <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600">ปฏิเสธแล้ว</span>}
          {r.status !== "PENDING" && r.reviewedBy && <p className="mt-1 text-[11px] text-gray-400">โดย {r.reviewedBy}</p>}
          {r.status !== "PENDING" && r.reviewNote && <p className="mt-1 text-xs text-gray-500">{r.reviewNote}</p>}
        </div>
      </div>

      {r.status === "PENDING" && canEdit && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                ผูกกับคนไลฟ์{matched && <span className="ml-1 text-emerald-600">(เจอจากเบอร์/LINE: {matched.name})</span>}
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={mode === "create" ? "__create" : streamerId}
                  onChange={(e) => {
                    if (e.target.value === "__create") setMode("create");
                    else {
                      setMode("pick");
                      setStreamerId(e.target.value);
                    }
                  }}
                  className={inputCls + " w-64"}
                >
                  <option value="__create">+ สร้างคนไลฟ์ใหม่จากคำขอนี้ ({r.requesterName})</option>
                  {streamers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.phone ? ` · ${s.phone}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-500">หมายเหตุ / เหตุผล (ถ้ามี)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls + " w-full"} placeholder="เช่น ยืนยันทาง LINE แล้ว / ช่วงนี้มีคนแล้ว" />
            </div>
            <button onClick={() => act("approve")} disabled={busy || (mode === "pick" && !streamerId)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {busy ? "กำลังทำ..." : "อนุมัติ → ลงตาราง"}
            </button>
            <button onClick={() => act("reject")} disabled={busy} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:border-red-200 hover:text-red-600 disabled:opacity-50">
              ปฏิเสธ
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}
      {r.status === "PENDING" && !canEdit && <p className="mt-2 text-xs text-gray-400">รอผู้จัดการอนุมัติ</p>}
    </li>
  );
}

export default function RequestsManager({
  status,
  counts,
  streamers,
  requests,
}: {
  status: Status | "ALL";
  counts: Record<Status, number>;
  streamers: StreamerOpt[];
  requests: RequestRow[];
}) {
  const router = useRouter();
  const tabs: { key: Status | "ALL"; label: string }[] = [
    { key: "PENDING", label: `รออนุมัติ (${counts.PENDING})` },
    { key: "APPROVED", label: `อนุมัติแล้ว (${counts.APPROVED})` },
    { key: "REJECTED", label: `ปฏิเสธ (${counts.REJECTED})` },
    { key: "ALL", label: "ทั้งหมด" },
  ];
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-white p-1">
        {tabs.map((t) => (
          <Link key={t.key} href={`/requests?status=${t.key}`} className={clsx("rounded-lg px-3 py-1.5 text-sm", status === t.key ? "bg-brand-600 font-medium text-white" : "text-gray-600 hover:bg-gray-50")}>
            {t.label}
          </Link>
        ))}
      </div>
      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-400">ไม่มีคำขอในหมวดนี้</div>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <RequestCard key={r.id} r={r} streamers={streamers} onChanged={() => router.refresh()} />
          ))}
        </ul>
      )}
    </div>
  );
}
