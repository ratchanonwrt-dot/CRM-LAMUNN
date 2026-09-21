"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ChecklistItem {
  id: string;
  itemName: string;
  quantity: number | null;
  isPacked: boolean;
}

export default function BookingChecklistPanel({ bookingId, items }: { bookingId: string; items: ChecklistItem[] }) {
  const router = useRouter();
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [saving, setSaving] = useState(false);

  const packedCount = items.filter((i) => i.isPacked).length;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!itemName) return;
    setSaving(true);
    await fetch(`/api/bookings/${bookingId}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemName, quantity: quantity || undefined }),
    });
    setSaving(false);
    setItemName("");
    setQuantity("");
    router.refresh();
  }

  async function handleToggle(item: ChecklistItem) {
    await fetch(`/api/bookings/${bookingId}/checklist/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPacked: !item.isPacked }),
    });
    router.refresh();
  }

  async function handleRemove(id: string) {
    await fetch(`/api/bookings/${bookingId}/checklist/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">
        เช็คลิสต์ของ/อุปกรณ์ {items.length > 0 && <span className="font-normal text-gray-400">({packedCount}/{items.length} จัดแล้ว)</span>}
      </h2>

      <div className="mb-4 flex flex-col gap-2">
        {items.map((item) => (
          <label key={item.id} className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm">
            <input type="checkbox" checked={item.isPacked} onChange={() => handleToggle(item)} className="h-4 w-4 accent-brand-600" />
            <span className={item.isPacked ? "flex-1 text-gray-400 line-through" : "flex-1 text-gray-800"}>
              {item.itemName}
              {item.quantity ? ` x${item.quantity}` : ""}
            </span>
            <button type="button" onClick={() => handleRemove(item.id)} className="text-xs text-red-500 hover:underline">
              ลบ
            </button>
          </label>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-400">ยังไม่มีรายการ</p>}
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">ชื่อของ/อุปกรณ์</label>
          <input value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-48 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">จำนวน</label>
          <input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-20 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
        </div>
        <button type="submit" disabled={saving || !itemName} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          + เพิ่ม
        </button>
      </form>
    </div>
  );
}
