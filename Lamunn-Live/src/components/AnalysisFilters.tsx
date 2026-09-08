"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

const inputCls = "rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400";

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** วันนี้ตามเวลาไทย (UTC+7) */
function todayTH(): Date {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export default function AnalysisFilters({
  from,
  to,
  channelId,
  channels,
}: {
  from: string;
  to: string;
  channelId: string;
  channels: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);
  const [ch, setCh] = useState(channelId);

  function apply(nf = f, nt = t, nch = ch) {
    const p = new URLSearchParams();
    p.set("from", nf);
    p.set("to", nt);
    if (nch) p.set("channel", nch);
    router.push(`/analysis?${p.toString()}`);
  }

  function preset(days: number | "month") {
    const today = todayTH();
    let start: Date;
    if (days === "month") start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    else start = new Date(today.getTime() - (days - 1) * 86400000);
    setF(iso(start));
    setT(iso(today));
    apply(iso(start), iso(today), ch);
  }

  const presets: { label: string; v: number | "month"; active: boolean }[] = [
    { label: "7 วัน", v: 7, active: false },
    { label: "30 วัน", v: 30, active: false },
    { label: "เดือนนี้", v: "month", active: false },
    { label: "90 วัน", v: 90, active: false },
  ];

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-1">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => preset(p.v)}
            className={clsx("rounded-lg px-2.5 py-1.5 text-xs font-medium", "text-gray-600 hover:bg-gray-100")}
          >
            {p.label}
          </button>
        ))}
      </div>
      <span className="hidden h-5 w-px bg-gray-200 sm:block" />
      <input type="date" value={f} onChange={(e) => setF(e.target.value)} className={inputCls} />
      <span className="text-xs text-gray-400">ถึง</span>
      <input type="date" value={t} onChange={(e) => setT(e.target.value)} className={inputCls} />
      <select value={ch} onChange={(e) => setCh(e.target.value)} className={inputCls}>
        <option value="">ทุกช่องทาง</option>
        {channels.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button onClick={() => apply()} className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
        ดูผล
      </button>
    </div>
  );
}
