"use client";

import { useState } from "react";
import { useServerRefresh } from "./useServerRefresh";
import Link from "next/link";
import type { DailySalesRow } from "@/lib/accounting/dailySales";

const fmt = (s: number) => (s === 0 ? "-" : (s / 100).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

const STATUS_LABEL: Record<string, string> = { DRAFT: "ร่าง", POSTED: "ผ่านรายการแล้ว", VOID: "ยกเลิกแล้ว" };
const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-amber-100 text-amber-700",
  POSTED: "bg-emerald-100 text-emerald-700",
  VOID: "bg-gray-100 text-gray-400",
};

/** ตารางยอดขายรายวันของเดือน + ปุ่มลงบัญชีทีละหลายวัน
 *
 * คอลัมน์ "ออกใบกำกับเต็มรูปแล้ว" ไม่ได้บวกเพิ่มเข้ายอดขาย — เป็นส่วนที่แยกออกมาจาก
 * ยอดขายรวมของวันนั้นเพื่อให้เห็นว่าไม่ได้ถูกนับซ้ำ ยอดที่ลงบัญชีคือ "ยอดขายรวม" คอลัมน์เดียว */
export default function DailyPostingPanel({ rows, canEdit }: { rows: DailySalesRow[]; canEdit: boolean }) {
  const { refresh, refreshing } = useServerRefresh();
  const postable = rows.filter((r) => !r.entryNo && r.gross > 0);
  const [selected, setSelected] = useState<Set<string>>(new Set(postable.map((r) => r.dateKey)));
  const [submitting, setSubmitting] = useState(false);
  const busy = submitting || refreshing;
  const [result, setResult] = useState<{ done: string[]; failed: { date: string; error: string }[] } | null>(null);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function post() {
    setSubmitting(true);
    setResult(null);
    const res = await fetch("/api/accounting/daily-posting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dates: [...selected] }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setResult({ done: [], failed: [{ date: "", error: data.error ?? "ลงบัญชีไม่สำเร็จ" }] });
      return;
    }
    setResult(data);
    refresh();
  }

  const totals = rows.reduce(
    (acc, r) => ({
      gross: acc.gross + r.gross,
      full: acc.full + r.fullTaxInvoice,
      abb: acc.abb + r.abbreviated,
      vat: acc.vat + r.vat,
    }),
    { gross: 0, full: 0, abb: 0, vat: 0 }
  );

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-500">
        เดือนนี้ยังไม่มียอดขายที่คีย์ไว้ — กรอกที่หน้า{" "}
        <Link href="/monthly" className="text-brand-700 underline">
          ยอดขายรายวัน (รายเดือน)
        </Link>{" "}
        ก่อน
      </div>
    );
  }

  return (
    <div>
      {canEdit && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
          <button
            type="button"
            disabled={busy || selected.size === 0}
            onClick={post}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40"
          >
            {busy ? "กำลังลงบัญชี..." : `ลงบัญชี ${selected.size} วันที่เลือก`}
          </button>
          <button
            type="button"
            onClick={() => setSelected(selected.size === postable.length ? new Set() : new Set(postable.map((r) => r.dateKey)))}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            {selected.size === postable.length ? "ไม่เลือกเลย" : "เลือกทุกวันที่ยังไม่ลง"}
          </button>
          <span className="text-xs text-gray-400">ระบบจะสร้างใบสำคัญขายเป็น &ldquo;ร่าง&rdquo; ให้ตรวจก่อนผ่านรายการ</span>
        </div>
      )}

      {result && (
        <div className="mb-4 space-y-2">
          {result.done.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              ลงบัญชีสำเร็จ {result.done.length} วัน — ไปตรวจและผ่านรายการได้ที่{" "}
              <Link href="/accounting/journal" className="underline">
                สมุดรายวัน
              </Link>
            </div>
          )}
          {result.failed.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <p className="mb-1 font-medium">ลงไม่ได้ {result.failed.length} รายการ</p>
              <ul className="list-disc space-y-0.5 pl-5">
                {result.failed.map((f, i) => (
                  <li key={i}>
                    {f.date && <span className="font-mono">{f.date}: </span>}
                    {f.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[52rem] text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
              {canEdit && <th className="w-10 py-2.5 pl-4" />}
              <th className="py-2.5 pr-3 text-left font-medium">วันที่</th>
              <th className="py-2.5 px-3 text-right font-medium">ยอดขายรวม (ลงบัญชี)</th>
              <th className="py-2.5 px-3 text-right font-medium">ในนั้น: ใบกำกับเต็มรูป</th>
              <th className="py-2.5 px-3 text-right font-medium">ที่เหลือ: ใบกำกับอย่างย่อ</th>
              <th className="py-2.5 px-3 text-right font-medium">ภาษีขาย</th>
              <th className="py-2.5 pr-4 text-left font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((r) => {
              const done = Boolean(r.entryNo);
              return (
                <tr key={r.dateKey} className={`border-b border-gray-50 ${done ? "bg-gray-50/40" : ""}`}>
                  {canEdit && (
                    <td className="py-2 pl-4">
                      {!done && r.gross > 0 && (
                        <input
                          type="checkbox"
                          checked={selected.has(r.dateKey)}
                          onChange={() => toggle(r.dateKey)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      )}
                    </td>
                  )}
                  <td className="py-2 pr-3 font-mono text-xs text-gray-600">{r.dateKey}</td>
                  <td className="py-2 px-3 text-right font-medium text-gray-900">{fmt(r.gross)}</td>
                  <td className="py-2 px-3 text-right text-gray-500">
                    {fmt(r.fullTaxInvoice)}
                    {r.fullTaxInvoiceCount > 0 && <span className="ml-1 text-xs text-gray-400">({r.fullTaxInvoiceCount} ใบ)</span>}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-500">{fmt(r.abbreviated)}</td>
                  <td className="py-2 px-3 text-right text-gray-500">{fmt(r.vat)}</td>
                  <td className="py-2 pr-4">
                    {done ? (
                      <span className="flex items-center gap-1.5">
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLE[r.entryStatus!]}`}>
                          {STATUS_LABEL[r.entryStatus!]}
                        </span>
                        <Link href="/accounting/journal" className="font-mono text-xs text-gray-400 hover:text-brand-700">
                          {r.entryNo}
                        </Link>
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">ยังไม่ลงบัญชี</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-800 font-semibold tabular-nums">
              <td colSpan={canEdit ? 2 : 1} className="py-2.5 pl-4">
                รวมทั้งเดือน
              </td>
              <td className="py-2.5 px-3 text-right">{fmt(totals.gross)}</td>
              <td className="py-2.5 px-3 text-right text-gray-500">{fmt(totals.full)}</td>
              <td className="py-2.5 px-3 text-right text-gray-500">{fmt(totals.abb)}</td>
              <td className="py-2.5 px-3 text-right text-gray-500">{fmt(totals.vat)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
