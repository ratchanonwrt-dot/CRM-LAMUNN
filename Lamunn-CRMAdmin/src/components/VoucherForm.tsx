"use client";

import { useState } from "react";

interface RewardOption {
  id: string;
  name: string;
  stock: number | null;
  discountPercent: number | null;
  discountMaxAmount: number | null;
}

export default function VoucherForm({ rewards }: { rewards: RewardOption[] }) {
  const [phone, setPhone] = useState("");
  const [rewardId, setRewardId] = useState(rewards[0]?.id ?? "");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ customerName: string; rewardName: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const res = await fetch("/api/admin/vouchers/grant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim(), rewardId, expiresAt: expiresAt || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "เกิดข้อผิดพลาด");
      return;
    }
    const rewardName = rewards.find((r) => r.id === rewardId)?.name ?? "";
    setSuccess({ customerName: data.customerName, rewardName });
    setPhone("");
  }

  if (rewards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
        ยังไม่มีรางวัลในระบบ — ไปเพิ่มรางวัลที่หน้า &quot;รางวัล&quot; ก่อน แล้วค่อยกลับมาออกวอเชอร์ที่นี่
      </div>
    );
  }

  const selectedReward = rewards.find((r) => r.id === rewardId);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6">
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
      <div>
        <label className="mb-1 block text-xs text-gray-500">ของรางวัล</label>
        <select value={rewardId} onChange={(e) => setRewardId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
          {rewards.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
              {r.discountPercent ? ` — ลด ${r.discountPercent}%${r.discountMaxAmount ? ` สูงสุด ${r.discountMaxAmount.toLocaleString("th-TH")} บ.` : ""}` : ""}
              {r.stock !== null ? ` (เหลือ ${r.stock})` : ""}
            </option>
          ))}
        </select>
        {selectedReward?.discountPercent ? (
          <p className="mt-1 text-xs text-amber-600">
            วอเชอร์ส่วนลด {selectedReward.discountPercent}%
            {selectedReward.discountMaxAmount ? ` (สูงสุด ${selectedReward.discountMaxAmount.toLocaleString("th-TH")} บาท)` : ""}
          </p>
        ) : null}
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">วันหมดอายุ (ไม่บังคับ — ว่าง = ไม่มีวันหมดอายุ)</label>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !phone.trim() || !rewardId}
        className="rounded-lg bg-brand-600 px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {loading ? "กำลังออกวอเชอร์..." : "ออกวอเชอร์"}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-brand-700">
          ออกวอเชอร์ &quot;{success.rewardName}&quot; ให้ {success.customerName} สำเร็จ — ลูกค้าจะเห็นคูปองที่หน้า &quot;คูปองของฉัน&quot; ในแอป
        </p>
      )}
    </form>
  );
}
