"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface BranchData {
  id: string;
  name: string;
  type: "CASH" | "CREDIT_TERM";
  isActive: boolean;
  sortOrder: number;
  rentConfig: {
    rentType: "FIX_RATE" | "GP";
    gpPercentStorefront: number;
    gpPercentDelivery: number;
    fixRateAmount: number | null;
    minAmount: number | null;
    vendorFeeMonthly: number;
    note: string | null;
  } | null;
  creditTermConfig: {
    splitMonth: boolean;
    period1PayDay: number | null;
    period1PayMonthOffset: number;
    period2PayDay: number | null;
    period2PayMonthOffset: number;
    fullMonthPayDay: number | null;
    fullMonthPayMonthOffset: number;
    deductDeliveryGp: boolean;
  } | null;
}

export default function BranchEditForm({ branch }: { branch: BranchData }) {
  const router = useRouter();
  const [name, setName] = useState(branch.name);
  const [type, setType] = useState(branch.type);
  const [isActive, setIsActive] = useState(branch.isActive);
  const [sortOrder, setSortOrder] = useState(branch.sortOrder.toString());

  const [rentType, setRentType] = useState(branch.rentConfig?.rentType ?? "GP");
  const [gpStorefront, setGpStorefront] = useState((branch.rentConfig?.gpPercentStorefront ?? 0).toString());
  const [gpDelivery, setGpDelivery] = useState((branch.rentConfig?.gpPercentDelivery ?? 0).toString());
  const [fixRateAmount, setFixRateAmount] = useState(branch.rentConfig?.fixRateAmount?.toString() ?? "");
  const [minAmount, setMinAmount] = useState(branch.rentConfig?.minAmount?.toString() ?? "");
  const [vendorFeeMonthly, setVendorFeeMonthly] = useState((branch.rentConfig?.vendorFeeMonthly ?? 0).toString());
  const [rentNote, setRentNote] = useState(branch.rentConfig?.note ?? "");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch(`/api/branches/${branch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        type,
        isActive,
        sortOrder,
        rent: {
          rentType,
          gpPercentStorefront: gpStorefront,
          gpPercentDelivery: gpDelivery,
          fixRateAmount,
          minAmount,
          vendorFeeMonthly,
          note: rentNote,
        },
      }),
    });

    setSaving(false);
    if (!res.ok) {
      setError("บันทึกไม่สำเร็จ");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">ข้อมูลสาขา</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500">ชื่อสาขา</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">ประเภท</label>
            <select value={type} onChange={(e) => setType(e.target.value as "CASH" | "CREDIT_TERM")} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white">
              <option value="CASH">เงินสด</option>
              <option value="CREDIT_TERM">Credit Term</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">ลำดับแสดงผล</label>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          ใช้งานสาขานี้
        </label>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">ค่าเช่า</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">ประเภทค่าเช่า</label>
            <select value={rentType} onChange={(e) => setRentType(e.target.value as "FIX_RATE" | "GP")} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white">
              <option value="GP">GP% ของยอดขาย</option>
              <option value="FIX_RATE">คงที่ต่อเดือน</option>
            </select>
          </div>
          {rentType === "FIX_RATE" ? (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">ค่าเช่าคงที่ (บาท/เดือน)</label>
              <input type="number" step="0.01" value={fixRateAmount} onChange={(e) => setFixRateAmount(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">GP% หน้าร้าน (เช่น 0.25 = 25%)</label>
                <input type="number" step="0.01" value={gpStorefront} onChange={(e) => setGpStorefront(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">GP% Delivery</label>
                <input type="number" step="0.01" value={gpDelivery} onChange={(e) => setGpDelivery(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">ค่าเช่าขั้นต่ำ/เดือน (Minimum, ไม่บังคับ)</label>
                <input type="number" step="0.01" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} placeholder="ไม่มี = ไม่บังคับขั้นต่ำ" className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
              </div>
            </>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">ค่าเปิด Vendor / รอบ (บาท)</label>
            <input type="number" step="0.01" value={vendorFeeMonthly} onChange={(e) => setVendorFeeMonthly(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-gray-500">หมายเหตุ</label>
          <input value={rentNote} onChange={(e) => setRentNote(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
        </div>
      </div>

      {type === "CREDIT_TERM" && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold text-gray-700">รอบจ่ายเงิน Credit Term</h2>
          <p className="mb-3 text-xs text-gray-400">
            กำหนดวันขายเริ่ม/สิ้นสุดรอบและวันเงินเข้าได้ที่หน้าตั้งค่า Credit Term แยกต่างหาก
          </p>
          <Link
            href="/credit-term/settings"
            className="inline-block rounded-lg bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
          >
            ไปหน้าตั้งค่ารอบจ่ายเงิน Credit Term →
          </Link>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !error && <p className="text-sm text-emerald-600">บันทึกแล้ว</p>}

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
