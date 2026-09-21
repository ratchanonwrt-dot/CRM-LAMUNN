"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toDateInputValue } from "@/lib/format";

interface BranchOption {
  id: string;
  name: string;
}

interface OrderData {
  id: string;
  customerName: string;
  customerPhone: string | null;
  branchId: string | null;
  itemsDescription: string;
  amount: number;
  paymentStatus: string;
  orderDate: string;
  pickupDate: string;
  status: string;
  note: string | null;
}

const PAYMENT_OPTIONS = [
  { value: "UNPAID", label: "ยังไม่ชำระ" },
  { value: "DEPOSIT_PAID", label: "มัดจำแล้ว" },
  { value: "FULLY_PAID", label: "ชำระครบแล้ว" },
];

const STATUS_OPTIONS = [
  { value: "PENDING", label: "รอเตรียมของ" },
  { value: "READY", label: "พร้อมให้รับ" },
  { value: "COMPLETED", label: "รับของแล้ว" },
  { value: "CANCELLED", label: "ยกเลิก" },
];

export default function PickupOrderEditForm({ order, branches }: { order: OrderData; branches: BranchOption[] }) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState(order.customerName);
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone ?? "");
  const [branchId, setBranchId] = useState(order.branchId ?? "");
  const [itemsDescription, setItemsDescription] = useState(order.itemsDescription);
  const [amount, setAmount] = useState(String(order.amount));
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [orderDate, setOrderDate] = useState(toDateInputValue(new Date(order.orderDate)));
  const [pickupDate, setPickupDate] = useState(toDateInputValue(new Date(order.pickupDate)));
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState(order.note ?? "");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch(`/api/pickup-orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        customerPhone,
        branchId: branchId || null,
        itemsDescription,
        amount,
        paymentStatus,
        orderDate,
        pickupDate,
        status,
        note,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("บันทึกไม่สำเร็จ");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">ชื่อลูกค้า</label>
          <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">เบอร์โทร</label>
          <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">รับที่สาขา</label>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white">
            <option value="">ไม่ระบุ</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3">
          <label className="mb-1 block text-xs font-medium text-gray-500">รายการที่สั่ง</label>
          <input required value={itemsDescription} onChange={(e) => setItemsDescription(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">ยอดเงิน (บาท)</label>
          <input required type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">สถานะการชำระเงิน</label>
          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white">
            {PAYMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">สถานะออเดอร์</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white">
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">วันที่สั่ง</label>
          <input required type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">วันที่นัดรับ</label>
          <input required type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
        </div>
        <div className="sm:col-span-3">
          <label className="mb-1 block text-xs font-medium text-gray-500">หมายเหตุ</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-3 text-sm text-emerald-600">บันทึกแล้ว</p>}
      <button type="submit" disabled={saving} className="mt-4 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 disabled:opacity-50">
        {saving ? "กำลังบันทึก..." : "บันทึก"}
      </button>
    </form>
  );
}
