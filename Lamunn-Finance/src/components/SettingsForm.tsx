"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const router = useRouter();
  const [grabFeePercent, setGrabFeePercent] = useState(settings.grabFeePercent ?? "0.23");
  const [grabFeeVatPercent, setGrabFeeVatPercent] = useState(settings.grabFeeVatPercent ?? "0.07");
  const [linemanFeePercent, setLinemanFeePercent] = useState(settings.linemanFeePercent ?? "0.15");
  const [cashOpeningBalance, setCashOpeningBalance] = useState(settings.cashOpeningBalance ?? "0");
  const [cashOpeningDate, setCashOpeningDate] = useState(settings.cashOpeningDate ?? "");
  const [companyName, setCompanyName] = useState(settings.companyName ?? "");
  const [companyAddress, setCompanyAddress] = useState(settings.companyAddress ?? "");
  const [companyTaxId, setCompanyTaxId] = useState(settings.companyTaxId ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grabFeePercent,
        grabFeeVatPercent,
        linemanFeePercent,
        cashOpeningBalance,
        cashOpeningDate,
        companyName,
        companyAddress,
        companyTaxId,
      }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-gray-700">ค่าธรรมเนียม Delivery</h2>
        <p className="mb-4 text-xs text-gray-400">ใช้คำนวณยอดสุทธิที่ควรเข้าบัญชี สำหรับหน้าสถานะเงินเข้าบัญชี</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Grab หัก GP% (เช่น 0.23 = 23%)</label>
            <input type="number" step="0.01" value={grabFeePercent} onChange={(e) => setGrabFeePercent(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Grab VAT บนค่า GP (เช่น 0.07 = 7%)</label>
            <input type="number" step="0.01" value={grabFeeVatPercent} onChange={(e) => setGrabFeeVatPercent(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Lineman หักทั้งหมด (รวม VAT แล้ว)</label>
            <input type="number" step="0.01" value={linemanFeePercent} onChange={(e) => setLinemanFeePercent(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-gray-700">ยอดเงินสดยกมาก่อนเริ่มระบบ</h2>
        <p className="mb-4 text-xs text-gray-400">ใช้เป็นจุดเริ่มต้นของหน้า &quot;สถานะเงินสด&quot;</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">ยอดยกมา (บาท)</label>
            <input type="number" step="0.01" value={cashOpeningBalance} onChange={(e) => setCashOpeningBalance(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">ยกมาก่อนวันที่</label>
            <input type="date" value={cashOpeningDate} onChange={(e) => setCashOpeningDate(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-gray-700">ข้อมูลบริษัท (สำหรับออกเอกสาร PDF วางบิล)</h2>
        <p className="mb-4 text-xs text-gray-400">ใช้พิมพ์หัวเอกสารวางบิลที่ export เป็น PDF — บางห้างต้องมีที่อยู่/เลขผู้เสียภาษีครบถึงจะรับเอกสาร</p>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">ชื่อบริษัท</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">ที่อยู่บริษัท</label>
            <textarea value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">เลขประจำตัวผู้เสียภาษี</label>
            <input type="text" value={companyTaxId} onChange={(e) => setCompanyTaxId(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
          </div>
        </div>
      </div>

      {saved && <p className="text-sm text-emerald-600">บันทึกแล้ว</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-fit rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 disabled:opacity-50"
      >
        {saving ? "กำลังบันทึก..." : "บันทึก"}
      </button>
    </form>
  );
}
