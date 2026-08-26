"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Branch {
  id: string;
  name: string;
}

export default function ConfirmRedemptionButton({
  redemptionId,
  branches,
  requiresPosBillNo,
}: {
  redemptionId: string;
  /** Passed only for HQ-level roles (no branchId of their own) — they must say
   * which branch physically handed the reward out. */
  branches?: Branch[];
  /** True for free (pointsSpent=0) vouchers — a POS discount was applied, so
   * we need the bill number on record for the per-transaction fraud check. */
  requiresPosBillNo?: boolean;
}) {
  const router = useRouter();
  const [branchId, setBranchId] = useState(branches?.[0]?.id ?? "");
  const [posBillNo, setPosBillNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/admin/redemptions/${redemptionId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(branches ? { branchId } : {}), ...(requiresPosBillNo ? { posBillNo } : {}) }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "ยืนยันไม่สำเร็จ");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      {branches && (
        <div>
          <label className="mb-1 block text-xs text-gray-500">สาขาที่ให้ลูกค้ารับรางวัล</label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {requiresPosBillNo && (
        <div>
          <label className="mb-1 block text-xs text-gray-500">เลขที่บิล POS (บังคับกรอก — ใช้ตรวจสอบส่วนลดย้อนหลัง)</label>
          <input
            value={posBillNo}
            onChange={(e) => setPosBillNo(e.target.value)}
            placeholder="เช่น 000123"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      )}
      <button
        onClick={handleConfirm}
        disabled={loading || (branches && !branchId) || (requiresPosBillNo && !posBillNo.trim())}
        className="rounded-lg bg-brand-600 px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {loading ? "กำลังยืนยัน..." : "ยืนยันแลกรางวัล"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
