"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

interface Branch {
  id: string;
  name: string;
}

export default function EnterPointsForm({ branches, defaultBranchId }: { branches: Branch[]; defaultBranchId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"points" | "amount">("points");
  const [phone, setPhone] = useState("");
  const [value, setValue] = useState("");
  const [receiptNo, setReceiptNo] = useState("");
  const [branchId, setBranchId] = useState(defaultBranchId || branches[0]?.id || "");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ customerName: string; points: number; pointsBalance: number } | null>(null);

  function switchMode(next: "points" | "amount") {
    setMode(next);
    setValue("");
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const res = await fetch("/api/admin/enter-points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: phone.trim(),
        branchId,
        note: note.trim() || undefined,
        ...(mode === "points" ? { points: Number(value) } : { amount: Number(value), receiptNo: receiptNo.trim() || undefined }),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "เกิดข้อผิดพลาด");
      return;
    }
    setSuccess({ customerName: data.customerName, points: data.points, pointsBalance: data.pointsBalance });
    setPhone("");
    setValue("");
    setReceiptNo("");
    setNote("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex rounded-lg bg-gray-100 p-1 text-sm">
        <button
          type="button"
          onClick={() => switchMode("points")}
          className={clsx("flex-1 rounded-md py-1.5 font-medium", mode === "points" ? "bg-white text-brand-700 shadow-sm" : "text-gray-500")}
        >
          กรอกแต้มตรงๆ
        </button>
        <button
          type="button"
          onClick={() => switchMode("amount")}
          className={clsx("flex-1 rounded-md py-1.5 font-medium", mode === "amount" ? "bg-white text-brand-700 shadow-sm" : "text-gray-500")}
        >
          กรอกยอดซื้อ (แปลงแต้มให้)
        </button>
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-500">เบอร์โทรลูกค้า</label>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08xxxxxxxx"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {mode === "points" ? (
        <div>
          <label className="mb-1 block text-xs text-gray-500">จำนวนแต้ม</label>
          <input
            type="number"
            required
            min={1}
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="เช่น 50"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      ) : (
        <>
          <div>
            <label className="mb-1 block text-xs text-gray-500">ยอดซื้อ (บาท)</label>
            <input
              type="number"
              required
              min={1}
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="เช่น 350"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-gray-400">ระบบจะแปลงเป็นแต้มให้เองตามกติกาสะสมแต้มของสาขานั้น</p>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">เลขที่ใบเสร็จ (ไม่บังคับ)</label>
            <input
              type="text"
              value={receiptNo}
              onChange={(e) => setReceiptNo(e.target.value)}
              placeholder="เช่น R00123"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </>
      )}

      <div>
        <label className="mb-1 block text-xs text-gray-500">สาขา</label>
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">หมายเหตุ (ไม่บังคับ)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="เช่น แจกแต้มโปรโมชั่นหน้าร้าน"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !phone.trim() || !value || !branchId}
        className="rounded-lg bg-brand-600 px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {loading ? "กำลังบันทึก..." : "บันทึกแต้ม"}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-brand-700">
          ให้ {success.points} แต้มแก่ {success.customerName} สำเร็จ · ยอดแต้มคงเหลือ {success.pointsBalance.toLocaleString("th-TH")} แต้ม
        </p>
      )}
    </form>
  );
}
