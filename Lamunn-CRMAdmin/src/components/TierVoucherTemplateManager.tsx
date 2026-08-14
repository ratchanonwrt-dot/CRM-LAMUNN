"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket, X } from "lucide-react";

interface VoucherOption {
  id: string;
  name: string;
  isActive?: boolean;
  discountPercent: number | null;
  discountMaxAmount: number | null;
  discountAmount: number | null;
  minSpendAmount: number | null;
}

interface Template {
  id: string;
  quantity: number;
  reward: VoucherOption;
}

function describeDiscount(r: VoucherOption): string {
  if (r.discountPercent) return `ลด ${r.discountPercent}%${r.discountMaxAmount ? ` สูงสุด ${r.discountMaxAmount.toLocaleString("th-TH")} บ.` : ""}`;
  if (r.discountAmount) return `ลด ${r.discountAmount.toLocaleString("th-TH")} บ.${r.minSpendAmount ? ` (ซื้อครบ ${r.minSpendAmount.toLocaleString("th-TH")} บ.)` : ""}`;
  return "";
}

export default function TierVoucherTemplateManager({
  tierId,
  templates,
  availableVouchers,
}: {
  tierId: string;
  templates: Template[];
  availableVouchers: VoucherOption[];
}) {
  const router = useRouter();
  const [rewardId, setRewardId] = useState(availableVouchers[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/admin/tiers/${tierId}/voucher-templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardId, quantity }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "เพิ่มไม่สำเร็จ");
      return;
    }
    setQuantity("1");
    router.refresh();
  }

  async function handleRemove(templateId: string) {
    if (!window.confirm("ลบวอเชอร์นี้ออกจากชุดที่แจกทุก 3 เดือนใช่ไหม?")) return;
    await fetch(`/api/admin/tiers/voucher-templates/${templateId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
        <Ticket size={14} className="text-amber-500" />
        วอเชอร์ที่แจกให้อัตโนมัติทุก 3 เดือน
      </p>

      {templates.length === 0 ? (
        <p className="mb-2 text-xs text-gray-400">ยังไม่มีวอเชอร์สำหรับระดับนี้</p>
      ) : (
        <ul className="mb-3 flex flex-col gap-1.5">
          {templates.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-md bg-gray-50 px-2.5 py-1.5 text-xs">
              <span>
                {t.reward.name} × {t.quantity} ใบ
                {describeDiscount(t.reward) ? ` — ${describeDiscount(t.reward)}` : ""}
                {t.reward.isActive === false && <span className="ml-1 text-amber-600">(วอเชอร์นี้ปิดใช้งานอยู่ — จะไม่แจกจนกว่าจะเปิดใช้งาน)</span>}
              </span>
              <button onClick={() => handleRemove(t.id)} className="shrink-0 rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-red-600" aria-label="ลบ">
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {availableVouchers.length === 0 ? (
        <p className="text-xs text-gray-400">ยังไม่มีวอเชอร์ในระบบ — ไปสร้างที่เมนู &quot;Voucher&quot; ก่อน</p>
      ) : (
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
          <select value={rewardId} onChange={(e) => setRewardId(e.target.value)} className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs">
            {availableVouchers.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
                {describeDiscount(v) ? ` (${describeDiscount(v)})` : ""}
                {v.isActive === false ? " — ปิดใช้งานอยู่" : ""}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-16 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs"
          />
          <button type="submit" disabled={loading} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
            {loading ? "กำลังเพิ่ม..." : "เพิ่ม"}
          </button>
        </form>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
