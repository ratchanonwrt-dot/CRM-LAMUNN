"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Coins } from "lucide-react";

interface Customer {
  id: string;
  name: string | null;
  phone: string | null;
  dateOfBirth: Date | null;
  pointsBalance: number;
}

export default function CustomerRow({
  customer,
  age,
  totalSpend,
  purchaseCount,
  avgOrderValue,
  lastPurchase,
}: {
  customer: Customer;
  age: number | null;
  totalSpend: number;
  purchaseCount: number;
  avgOrderValue: number;
  lastPurchase: Date | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [points, setPoints] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/admin/customers/${customer.id}/adjust-points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points, note: note || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "ปรับแต้มไม่สำเร็จ");
      return;
    }
    setEditing(false);
    setPoints("");
    setNote("");
    router.refresh();
  }

  return (
    <>
      <tr className="border-t border-gray-100">
        <td className="px-4 py-2">{customer.name ?? "-"}</td>
        <td className="px-4 py-2 text-gray-500">{customer.phone ?? "-"}</td>
        <td className="px-4 py-2 text-gray-500">{customer.dateOfBirth ? format(customer.dateOfBirth, "d MMM yyyy") : "-"}</td>
        <td className="px-4 py-2 text-gray-500">{age ?? "-"}</td>
        <td className="px-4 py-2 font-medium text-brand-700">{customer.pointsBalance}</td>
        <td className="px-4 py-2 text-gray-500">{totalSpend.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</td>
        <td className="px-4 py-2 text-gray-500">{purchaseCount}</td>
        <td className="px-4 py-2 text-gray-500">{avgOrderValue > 0 ? avgOrderValue.toLocaleString("th-TH", { maximumFractionDigits: 0 }) : "-"}</td>
        <td className="px-4 py-2 text-gray-500">{lastPurchase ? format(lastPurchase, "d MMM yyyy") : "-"}</td>
        <td className="px-4 py-2">
          <button
            onClick={() => setEditing((v) => !v)}
            className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600"
          >
            <Coins size={12} />
            {editing ? "ยกเลิก" : "ปรับแต้ม"}
          </button>
        </td>
      </tr>
      {editing && (
        <tr className="border-t border-gray-100 bg-gray-50">
          <td colSpan={10} className="px-4 py-3">
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
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
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
