"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReceiptText } from "lucide-react";

export default function B2BPurchaseForm({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    const res = await fetch(`/api/admin/b2b/${customerId}/purchase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, note: note || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    setResult(`บันทึกยอดซื้อแล้ว ยอดสะสมรวม ${Number(data.totalSpend).toLocaleString("th-TH", { maximumFractionDigits: 0 })} บาท`);
    setAmount("");
    setNote("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <ReceiptText size={18} className="text-stone-500" />
        กรอกยอดซื้อ
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-gray-500">ยอดซื้อ (บาท)</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            placeholder="เช่น 15000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-gray-500">หมายเหตุ (ไม่บังคับ)</label>
          <input
            placeholder="เช่น ออเดอร์งานเลี้ยง 12 ต.ค."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <button type="submit" disabled={loading} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {loading ? "กำลังบันทึก..." : "บันทึกยอดซื้อ"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {result && <p className="text-xs text-brand-700">{result}</p>}
    </form>
  );
}
