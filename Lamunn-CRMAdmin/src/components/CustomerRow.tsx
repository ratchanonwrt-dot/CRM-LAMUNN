"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Coins, ReceiptText } from "lucide-react";

interface Customer {
  id: string;
  name: string | null;
  phone: string | null;
  dateOfBirth: Date | null;
  pointsBalance: number;
  currentTierName: string | null;
}

interface Branch {
  id: string;
  name: string;
}

type Mode = "none" | "adjust" | "manual";

export default function CustomerRow({
  customer,
  age,
  totalSpend,
  purchaseCount,
  avgOrderValue,
  lastPurchase,
  branches,
}: {
  customer: Customer;
  age: number | null;
  totalSpend: number;
  purchaseCount: number;
  avgOrderValue: number;
  lastPurchase: Date | null;
  branches: Branch[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("none");

  const [points, setPoints] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  const [amount, setAmount] = useState("");
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [receiptNo, setReceiptNo] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [manualResult, setManualResult] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggle(next: Mode) {
    setMode((current) => (current === next ? "none" : next));
    setError(null);
    setManualResult(null);
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/admin/customers/${customer.id}/adjust-points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points, note: adjustNote || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "ปรับแต้มไม่สำเร็จ");
      return;
    }
    setMode("none");
    setPoints("");
    setAdjustNote("");
    router.refresh();
  }

  async function handleManualEarn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/admin/customers/${customer.id}/manual-earn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, branchId: branchId || undefined, receiptNo: receiptNo || undefined, note: manualNote || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    setManualResult(`ให้แต้มแล้ว +${data.pointsEarned} แต้ม`);
    setAmount("");
    setReceiptNo("");
    setManualNote("");
    router.refresh();
  }

  return (
    <>
      <tr className="border-t border-gray-100">
        <td className="px-4 py-2">{customer.name ?? "-"}</td>
        <td className="px-4 py-2 text-gray-500">{customer.phone ?? "-"}</td>
        <td className="px-4 py-2 text-gray-500">{customer.dateOfBirth ? format(customer.dateOfBirth, "d MMM yyyy") : "-"}</td>
        <td className="px-4 py-2 text-gray-500">{age ?? "-"}</td>
        <td className="px-4 py-2">
          {customer.currentTierName ? (
            <span className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-xs font-medium text-fuchsia-700">{customer.currentTierName}</span>
          ) : (
            <span className="text-xs text-gray-400">-</span>
          )}
        </td>
        <td className="px-4 py-2 font-medium text-brand-700">{customer.pointsBalance}</td>
        <td className="px-4 py-2 text-gray-500">{totalSpend.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</td>
        <td className="px-4 py-2 text-gray-500">{purchaseCount}</td>
        <td className="px-4 py-2 text-gray-500">{avgOrderValue > 0 ? avgOrderValue.toLocaleString("th-TH", { maximumFractionDigits: 0 }) : "-"}</td>
        <td className="px-4 py-2 text-gray-500">{lastPurchase ? format(lastPurchase, "d MMM yyyy") : "-"}</td>
        <td className="px-4 py-2">
          <div className="flex gap-1.5">
            <button
              onClick={() => toggle("manual")}
              className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
            >
              <ReceiptText size={12} />
              {mode === "manual" ? "ยกเลิก" : "กรอกยอดซื้อ"}
            </button>
            <button
              onClick={() => toggle("adjust")}
              className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600"
            >
              <Coins size={12} />
              {mode === "adjust" ? "ยกเลิก" : "ปรับแต้ม"}
            </button>
          </div>
        </td>
      </tr>

      {mode === "manual" && (
        <tr className="border-t border-gray-100 bg-gray-50">
          <td colSpan={11} className="px-4 py-3">
            <form onSubmit={handleManualEarn} className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">ยอดซื้อ (บาท)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="เช่น 350"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              {branches.length > 0 && (
                <div>
                  <label className="mb-1 block text-xs text-gray-500">สาขา</label>
                  <select
                    required
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs text-gray-500">เลขที่ใบเสร็จ (ไม่บังคับ)</label>
                <input
                  placeholder="ถ้ามี"
                  value={receiptNo}
                  onChange={(e) => setReceiptNo(e.target.value)}
                  className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-500">หมายเหตุ (ไม่บังคับ)</label>
                <input
                  placeholder="เช่น เครื่องพิมพ์ใบเสร็จเสีย"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <button type="submit" disabled={loading} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                {loading ? "กำลังบันทึก..." : "ให้แต้ม"}
              </button>
              {error && <p className="w-full text-xs text-red-600">{error}</p>}
              {manualResult && <p className="w-full text-xs text-brand-700">{manualResult}</p>}
            </form>
          </td>
        </tr>
      )}

      {mode === "adjust" && (
        <tr className="border-t border-gray-100 bg-gray-50">
          <td colSpan={11} className="px-4 py-3">
            <form onSubmit={handleAdjust} className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">จำนวนแต้ม (ติดลบ = หัก)</label>
                <input
                  required
                  type="number"
                  placeholder="เช่น 50 หรือ -20"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-500">หมายเหตุ (ไม่บังคับ)</label>
                <input
                  placeholder="เช่น ชดเชยระบบขัดข้อง"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <button type="submit" disabled={loading} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                {loading ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              {error && <p className="w-full text-xs text-red-600">{error}</p>}
            </form>
          </td>
        </tr>
      )}
    </>
  );
}
