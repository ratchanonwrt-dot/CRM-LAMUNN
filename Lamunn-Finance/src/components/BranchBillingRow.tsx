"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCanEdit } from "@/lib/RoleContext";
import { computeMallGroupBilling, type ChannelBillingResult } from "@/lib/billingCalc";
import { formatBaht, formatThaiDate } from "@/lib/format";

function ChannelTable({
  title,
  gpPercent,
  result,
  appliesWht,
}: {
  title: string;
  gpPercent: number;
  result: ChannelBillingResult;
  appliesWht: boolean;
}) {
  const row = (label: string, value: string, highlight?: boolean) => (
    <tr>
      <td className="py-1 pr-3 text-gray-500">{label}</td>
      <td className={`py-1 text-right font-medium ${highlight ? "rounded bg-amber-100 px-2 text-amber-800" : "text-gray-800"}`}>{value}</td>
    </tr>
  );
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="mb-2 text-xs font-semibold text-gray-600">{title}</p>
      <table className="w-full text-xs">
        <tbody>
          {row("ยอดขายรวม VAT", formatBaht(result.salesIncVat), true)}
          {row("ยอดขายไม่รวม VAT", formatBaht(result.salesNoVat))}
          {row("GP %", `${(gpPercent * 100).toFixed(2)}%`, true)}
          {row("GP ไม่รวม VAT", formatBaht(result.gpNoVat), true)}
          {row("VAT ของ GP", formatBaht(result.gpVat), true)}
          {row("รวมเงินที่ต้องโอนเข้า (Total Debt)", formatBaht(result.totalDebt), true)}
          {appliesWht && row("หัก ณ ที่จ่าย 3%", formatBaht(result.wht), true)}
        </tbody>
      </table>
      <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 px-2.5 py-2">
        <span className="text-xs font-medium text-emerald-700">ยอดโอนเข้าจริง (Pay-in)</span>
        <span className="text-sm font-bold text-emerald-700">{formatBaht(result.netTransfer)}</span>
      </div>
    </div>
  );
}

export default function BranchBillingRow({
  branchId,
  branchName,
  periodLabel,
  periodStart,
  periodEnd,
  gpPercentStorefront,
  gpPercentDelivery,
  initialStorefrontIncVat,
  initialDeliveryIncVat,
  initialBillingDate,
  dueDateIso,
  paymentDelayDays,
  appliesWht = true,
}: {
  branchId: string;
  branchName: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  gpPercentStorefront: number;
  gpPercentDelivery: number;
  initialStorefrontIncVat: number;
  initialDeliveryIncVat: number;
  initialBillingDate: string | null;
  dueDateIso: string | null; // "YYYY-MM-DD" — ต้องวางบิลภายในวันนี้
  paymentDelayDays: number | null; // ห้างโอนเงินเข้ากี่วันหลังวางบิลจริง
  appliesWht?: boolean; // false สำหรับห้างที่ไม่หัก ณ ที่จ่าย (ตาม billingGroup.usesWithholdingCert)
}) {
  const router = useRouter();
  const canEdit = useCanEdit("CREDIT_TERM");
  const [storefront, setStorefront] = useState(initialStorefrontIncVat ? initialStorefrontIncVat.toString() : "");
  const [delivery, setDelivery] = useState(initialDeliveryIncVat ? initialDeliveryIncVat.toString() : "");
  const [billingDate, setBillingDate] = useState(initialBillingDate ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const result = computeMallGroupBilling(Number(storefront) || 0, Number(delivery) || 0, gpPercentStorefront, gpPercentDelivery, appliesWht);

  const submitted = Boolean(billingDate);
  const today = new Date().toISOString().slice(0, 10);
  const overdue = !submitted && !!dueDateIso && dueDateIso < today;
  const dueSoon = !submitted && !!dueDateIso && !overdue && dueDateIso <= new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const expectedPaymentDate =
    submitted && paymentDelayDays != null ? new Date(new Date(billingDate).getTime() + paymentDelayDays * 86400000) : null;

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/branch-billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        branchId,
        periodStart,
        periodEnd,
        storefrontSalesIncVat: Number(storefront) || 0,
        deliverySalesIncVat: Number(delivery) || 0,
        billingDate: billingDate || null,
      }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-800">{branchName}</p>
          <p className="text-xs text-gray-400">ยอดขายรอบ {periodLabel}</p>
          <a
            href={`/api/export/billing-pdf?branchId=${branchId}&periodStart=${periodStart}&periodEnd=${periodEnd}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700"
          >
            ⬇ ดาวน์โหลด PDF (ใบสรุปยอด + ใบรับเงิน)
          </a>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          {submitted ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              ✓ วางบิลแล้ว {formatThaiDate(new Date(billingDate))}
            </span>
          ) : dueDateIso ? (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                overdue ? "bg-red-100 text-red-700" : dueSoon ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {overdue ? "⚠ เลยกำหนดแล้ว — " : "ต้องวางบิลภายใน "}
              {formatThaiDate(new Date(dueDateIso))}
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-400">ยังไม่ได้ตั้งกำหนดวางบิล</span>
          )}
          {expectedPaymentDate && (
            <span className="text-[11px] text-gray-400">คาดว่าเงินเข้า {formatThaiDate(expectedPaymentDate)}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">ยอดขายหน้าร้าน (รวม VAT)</label>
          <input
            type="number"
            step="0.01"
            value={storefront}
            disabled={!canEdit}
            onChange={(e) => setStorefront(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">ยอดขาย Delivery (รวม VAT)</label>
          <input
            type="number"
            step="0.01"
            value={delivery}
            disabled={!canEdit}
            onChange={(e) => setDelivery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">วางบิลวันที่</label>
          <input
            type="date"
            value={billingDate}
            disabled={!canEdit}
            onChange={(e) => setBillingDate(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ChannelTable title="หน้าร้าน (Sales)" gpPercent={gpPercentStorefront} result={result.storefront} appliesWht={appliesWht} />
        <ChannelTable title="Delivery (Grab/Lineman)" gpPercent={gpPercentDelivery} result={result.delivery} appliesWht={appliesWht} />
      </div>

      <div className={`mt-3 grid grid-cols-1 gap-3 ${appliesWht ? "sm:grid-cols-2" : ""}`}>
        <div className="flex items-center justify-between rounded-lg bg-violet-50 px-3 py-2.5">
          <span className="text-xs font-medium text-violet-700">GP รวม (หน้าร้าน + Delivery)</span>
          <span className="text-sm font-bold text-violet-700">{formatBaht(result.storefront.gpNoVat + result.delivery.gpNoVat)} บาท</span>
        </div>
        {appliesWht && (
          <div className="flex items-center justify-between rounded-lg bg-violet-50 px-3 py-2.5">
            <span className="text-xs font-medium text-violet-700">หัก ณ ที่จ่ายรวม (หน้าร้าน + Delivery) — ใช้ทำใบหัก ณ ที่จ่าย</span>
            <span className="text-sm font-bold text-violet-700">{formatBaht(result.storefront.wht + result.delivery.wht)} บาท</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2.5">
        <span className="text-xs font-medium text-brand-700">
          ยอดสุดท้ายที่ห้างต้องโอนคืน (หน้าร้าน หัก GP+VAT{appliesWht ? "+WHT" : ""} ของ Delivery ออก เพราะยอด Delivery โอนเข้าตรงจาก Grab/Lineman อยู่แล้ว)
        </span>
        <span className="text-lg font-bold text-brand-700">{formatBaht(result.finalNetTransfer)} บาท</span>
      </div>

      {canEdit && (
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-medium text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          {saved && !saving && <span className="text-sm text-emerald-600">บันทึกแล้ว</span>}
        </div>
      )}
    </div>
  );
}
