"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

const inputCls = "rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10";

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
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-white shadow-card p-3">
      <div className="flex items-center gap-1">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => preset(p.v)}
            className={clsx("rounded-lg px-2.5 py-1.5 text-xs font-medium", "text-muted hover:bg-stone-100")}
          >
            {p.label}
          </button>
        ))}
      </div>
      <span className="hidden h-5 w-px bg-stone-200 sm:block" />
      <input type="date" value={f} onChange={(e) => setF(e.target.value)} className={inputCls} />
      <span className="text-xs text-stone-400">ถึง</span>
      <input type="date" value={t} onChange={(e) => setT(e.target.value)} className={inputCls} />
      <select value={ch} onChange={(e) => setCh(e.target.value)} className={inputCls}>
        <option value="">ทุกช่องทาง</option>
        {channels.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button onClick={() => apply()} className="rounded-lg bg-ink px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-600">
        ดูผล
      </button>
    </div>
  );
}
