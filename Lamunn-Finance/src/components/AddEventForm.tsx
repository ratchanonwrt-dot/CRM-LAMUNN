"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddEventForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [storefront, setStorefront] = useState("");
  const [grab, setGrab] = useState("");
  const [lineman, setLineman] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, startDate, endDate, location, storefront, grab, lineman, note }),
    });
    setSaving(false);
    setName("");
    setStartDate("");
    setEndDate("");
    setLocation("");
    setStorefront("");
    setGrab("");
    setLineman("");
    setNote("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mb-4 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-brand-600/20 hover:bg-brand-700">
        + เพิ่ม Event ใหม่
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">ชื่องาน / Event</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">วันที่เริ่ม</label>
          <input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">วันที่สิ้นสุด</label>
          <input required type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">สถานที่</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">ยอดขายหน้าร้าน</label>
          <input type="number" step="0.01" value={storefront} onChange={(e) => setStorefront(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Grab</label>
          <input type="number" step="0.01" value={grab} onChange={(e) => setGrab(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Lineman</label>
          <input type="number" step="0.01" value={lineman} onChange={(e) => setLineman(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-500">หมายเหตุ</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={saving} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          {saving ? "กำลังบันทึก..." : "บันทึก Event"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
          ยกเลิก
        </button>
      </div>
    </form>
  );
}
