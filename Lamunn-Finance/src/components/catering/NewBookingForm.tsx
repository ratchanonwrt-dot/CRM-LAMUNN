"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DateSelect from "./DateSelect";
import TimeSelect from "./TimeSelect";

const SOURCE_OPTIONS = [
  { value: "", label: "ไม่ระบุ" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "LINE", label: "Line" },
  { value: "REFERRAL", label: "คนแนะนำ/บอกต่อ" },
  { value: "WALK_IN", label: "เดินเข้ามาเอง" },
  { value: "GOOGLE", label: "Google" },
  { value: "OTHER", label: "อื่นๆ" },
];

export default function NewBookingForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [source, setSource] = useState("");
  const [foundExisting, setFoundExisting] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  const [eventDate, setEventDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePhoneBlur() {
    if (!phone) return;
    setLookingUp(true);
    const res = await fetch(`/api/catering/customers?phone=${encodeURIComponent(phone)}`);
    setLookingUp(false);
    if (!res.ok) return;
    const body = await res.json();
    if (body.customer) {
      setCustomerName(body.customer.name);
      setSource(body.customer.source ?? "");
      setFoundExisting(true);
    } else {
      setFoundExisting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/catering/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        customerName,
        source: source || undefined,
        eventDate,
        eventEndDate: eventEndDate || undefined,
        eventStartTime: eventStartTime || undefined,
        eventEndTime: eventEndTime || undefined,
        location: location || undefined,
        guestCount: guestCount || undefined,
        totalAmount,
        depositAmount: depositAmount || undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    const body = await res.json();
    router.push(`/catering/bookings/${body.booking.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">ข้อมูลลูกค้า</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">เบอร์โทร</label>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={handlePhoneBlur}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
            />
            {lookingUp && <p className="mt-1 text-xs text-gray-400">กำลังค้นหา...</p>}
            {foundExisting && <p className="mt-1 text-xs text-emerald-600">พบลูกค้าเดิม — เติมข้อมูลให้แล้ว</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">ชื่อลูกค้า</label>
            <input
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">ลูกค้ามาจากไหน</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
            >
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">รายละเอียดงาน</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">วันจัดงาน</label>
            <DateSelect required value={eventDate} onChange={setEventDate} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">ถึงวันที่ (ถ้าจัดต่อกันหลายวัน)</label>
            <DateSelect value={eventEndDate} onChange={setEventEndDate} />
            <p className="mt-1 text-[11px] text-gray-400">เว้นว่างถ้าจัดวันเดียว — กรอกแล้วจะเปิดให้แจงจำนวนเสิร์ฟ/โน้ตแยกแต่ละวันได้หลังบันทึก</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">เวลาเริ่ม</label>
            <TimeSelect value={eventStartTime} onChange={setEventStartTime} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">เวลาสิ้นสุด</label>
            <TimeSelect value={eventEndTime} onChange={setEventEndTime} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500">สถานที่จัดงาน</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">จำนวนแขก</label>
            <input
              type="number"
              min="0"
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">ยอดเงิน</h2>
        <p className="mb-4 -mt-2 text-xs text-gray-400">กรอกยอดรวมคร่าวๆ ไว้ก่อนได้ — ปรับให้ตรงจากรายการ/เมนูที่ติ๊กเลือกได้อีกทีในหน้ารายละเอียดหลังบันทึก</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">ยอดรวม (บาท)</label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">มัดจำที่ได้รับแล้ว (ถ้ามี)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="เช่น 50% ของยอดรวม"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 disabled:opacity-50"
      >
        {saving ? "กำลังบันทึก..." : "บันทึกการจอง"}
      </button>
    </form>
  );
}
