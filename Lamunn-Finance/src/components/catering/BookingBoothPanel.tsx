"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCanEdit } from "@/lib/RoleContext";

export default function BookingBoothPanel({
  bookingId,
  needsBooth,
  specialRequest,
}: {
  bookingId: string;
  needsBooth: boolean;
  specialRequest: string | null;
}) {
  const router = useRouter();
  const canEdit = useCanEdit("CATERING");
  const [booth, setBooth] = useState(needsBooth);
  const [request, setRequest] = useState(specialRequest ?? "");
  const [saving, setSaving] = useState(false);

  async function handleBoothChange(checked: boolean) {
    setBooth(checked);
    setSaving(true);
    await fetch(`/api/catering/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ needsBooth: checked }),
    });
    setSaving(false);
    router.refresh();
  }

  async function handleRequestBlur() {
    if (request === (specialRequest ?? "")) return;
    setSaving(true);
    await fetch(`/api/catering/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specialRequest: request }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">เช็คลิสต์งาน</h2>

      <label className="mb-4 flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={booth}
          disabled={!canEdit || saving}
          onChange={(e) => handleBoothChange(e.target.checked)}
          className="h-4 w-4 accent-brand-600"
        />
        <span className="text-gray-800">เอาบูธไปด้วย</span>
      </label>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">มีอะไรพิเศษไหม</label>
        <input
          value={request}
          disabled={!canEdit}
          onChange={(e) => setRequest(e.target.value)}
          onBlur={handleRequestBlur}
          placeholder="เช่น ต้องการโต๊ะเพิ่ม, แพ้อาหารบางอย่าง"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>
    </div>
  );
}
