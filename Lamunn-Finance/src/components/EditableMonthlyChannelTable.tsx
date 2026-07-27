"use client";

import { useState } from "react";
import { formatBaht } from "@/lib/format";

interface DayRow {
  date: string; // yyyy-mm-dd
  dayLabel: string;
  storefrontTotal: number;
  grab: number;
  lineman: number;
  tiktok: number;
  fbLine: number;
  pickup: number;
  catering: number;
}

function EditableCell({ date, field, value }: { date: string; field: string; value: number }) {
  const [val, setVal] = useState(value.toString());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleBlur() {
    if (Number(val) === value) return;
    setSaving(true);
    setSaved(false);
    await fetch("/api/company-channel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, [field]: val }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <input
      type="number"
      step="0.01"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={handleBlur}
      className={`w-24 rounded-lg border px-2 py-1 text-right text-sm outline-none transition-colors ${
        saving ? "border-amber-300 bg-amber-50" : saved ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-gray-50 focus:border-brand-400 focus:bg-white"
      }`}
    />
  );
}

export default function EditableMonthlyChannelTable({ rows }: { rows: DayRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="px-3 py-2">วันที่</th>
            <th className="px-3 py-2 text-right">หน้าร้านรวม (ทุกสาขา)</th>
            <th className="px-3 py-2 text-right">Grab</th>
            <th className="px-3 py-2 text-right">Lineman</th>
            <th className="px-3 py-2 text-right">TikTok</th>
            <th className="px-3 py-2 text-right">FB / Line</th>
            <th className="px-3 py-2 text-right">รับหน้าร้าน</th>
            <th className="px-3 py-2 text-right">Catering</th>
            <th className="px-3 py-2 text-right">รวมวันนั้น</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const total = r.storefrontTotal + r.grab + r.lineman + r.tiktok + r.fbLine + r.pickup + r.catering;
            return (
              <tr key={r.date} className="border-t border-gray-100">
                <td className="px-3 py-1.5 whitespace-nowrap">{r.dayLabel}</td>
                <td className="px-3 py-1.5 text-right text-gray-500">{formatBaht(r.storefrontTotal)}</td>
                <td className="px-3 py-1.5 text-right text-gray-500">{formatBaht(r.grab)}</td>
                <td className="px-3 py-1.5 text-right text-gray-500">{formatBaht(r.lineman)}</td>
                <td className="px-3 py-1.5 text-right">
                  <EditableCell date={r.date} field="tiktok" value={r.tiktok} />
                </td>
                <td className="px-3 py-1.5 text-right">
                  <EditableCell date={r.date} field="fbLine" value={r.fbLine} />
                </td>
                <td className="px-3 py-1.5 text-right">
                  <EditableCell date={r.date} field="pickup" value={r.pickup} />
                </td>
                <td className="px-3 py-1.5 text-right">
                  <EditableCell date={r.date} field="catering" value={r.catering} />
                </td>
                <td className="px-3 py-1.5 text-right font-semibold text-brand-700">{formatBaht(total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
