"use client";

import { useState } from "react";

export default function QrSimulatorClient() {
  const [branchCode, setBranchCode] = useState("BR01");
  const [receiptNo, setReceiptNo] = useState("0001");
  const [amount, setAmount] = useState("350");
  const [result, setResult] = useState<{ content: string; dataUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [reconcileResult, setReconcileResult] = useState<{
    voidedBills: { checked: number; reversed: number };
    branches: { created: string[]; activated: string[]; deactivated: string[] };
  } | null>(null);
  const [reconcileError, setReconcileError] = useState<string | null>(null);
  const [reconciling, setReconciling] = useState(false);

  async function handleReconcile() {
    setReconcileError(null);
    setReconcileResult(null);
    setReconciling(true);
    const res = await fetch("/api/admin/reconcile-voided-bills", { method: "POST" });
    const data = await res.json();
    setReconciling(false);
    if (!res.ok) {
      setReconcileError(data.error ?? "ตรวจสอบไม่สำเร็จ");
      return;
    }
    setReconcileResult(data);
  }

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

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-1 text-base font-semibold text-gray-800">ซิงค์ข้อมูลกับ POS</h2>
        <p className="mb-3 text-sm text-gray-500">
          เช็ค 2 อย่างพร้อมกัน: (1) แต้มที่ให้ไปใน 14 วันล่าสุด เทียบกับสถานะบิลจริง — ถ้าบิลไหนถูก void ทีหลัง หักแต้มคืนอัตโนมัติ
          (2) สาขาในระบบ CRM เทียบกับสาขาที่ POS เปิด/ปิดจริง — สาขาไหน POS เพิ่งเปิดจะสร้าง/เปิดให้อัตโนมัติ สาขาไหน POS ปิดจะปิดให้อัตโนมัติ
          (รันอัตโนมัติทุกวันอยู่แล้ว ปุ่มนี้ไว้เช็คด่วนได้ทันที)
        </p>
        <button
          onClick={handleReconcile}
          disabled={reconciling}
          className="rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {reconciling ? "กำลังตรวจสอบ..." : "ตรวจสอบตอนนี้"}
        </button>
        {reconcileError && <p className="mt-2 text-sm text-red-600">{reconcileError}</p>}
        {reconcileResult && (
          <div className="mt-2 space-y-1 text-sm text-gray-600">
            <p>
              ใบเสร็จที่ถูก void: ตรวจแล้ว {reconcileResult.voidedBills.checked} รายการ — หักแต้มคืน{" "}
              {reconcileResult.voidedBills.reversed} รายการ
            </p>
            <p>
              สาขา: สร้างใหม่ {reconcileResult.branches.created.length || 0}
              {reconcileResult.branches.created.length > 0 && ` (${reconcileResult.branches.created.join(", ")})`}
              {" — "}เปิดใช้งาน {reconcileResult.branches.activated.length || 0}
              {reconcileResult.branches.activated.length > 0 && ` (${reconcileResult.branches.activated.join(", ")})`}
              {" — "}ปิดใช้งาน {reconcileResult.branches.deactivated.length || 0}
              {reconcileResult.branches.deactivated.length > 0 && ` (${reconcileResult.branches.deactivated.join(", ")})`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
