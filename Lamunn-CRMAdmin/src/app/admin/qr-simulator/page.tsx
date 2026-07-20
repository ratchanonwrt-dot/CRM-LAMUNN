"use client";

import { useState } from "react";

export default function QrSimulatorPage() {
  const [branchCode, setBranchCode] = useState("BR01");
  const [receiptNo, setReceiptNo] = useState("0001");
  const [amount, setAmount] = useState("350");
  const [result, setResult] = useState<{ content: string; dataUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/qr-simulator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchCode, receiptNo, amount }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "สร้าง QR ไม่สำเร็จ");
      return;
    }
    setResult(data);
  }

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-800">จำลอง QR จาก POS (สำหรับทดสอบ)</h1>
      <p className="mb-6 text-sm text-gray-500">
        ใช้หน้านี้ทดสอบ flow การสแกน/สะสมแต้ม ก่อนที่ POS จริงจะพร้อมพิมพ์ QR ท้ายใบเสร็จ
      </p>

      <form onSubmit={handleGenerate} className="mb-6 grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-4">
        <input required placeholder="รหัสสาขา" value={branchCode} onChange={(e) => setBranchCode(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input required placeholder="เลขที่ใบเสร็จ" value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input required type="number" step="0.01" placeholder="ยอดซื้อ (บาท)" value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button type="submit" disabled={loading} className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
          {loading ? "กำลังสร้าง..." : "สร้าง QR"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.dataUrl} alt="QR code" className="h-64 w-64" />
          <p className="max-w-md break-all text-center text-xs text-gray-400">{result.content}</p>
        </div>
      )}
    </div>
  );
}
