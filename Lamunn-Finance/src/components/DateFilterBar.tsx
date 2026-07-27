"use client";

import { useRouter } from "next/navigation";

export default function DateFilterBar({ basePath, date }: { basePath: string; date: string }) {
  const router = useRouter();

  function update(next: string) {
    router.push(`${basePath}?date=${next}`);
  }

  return (
    <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">วันที่</label>
        <input
          type="date"
          value={date}
          onChange={(e) => update(e.target.value)}
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 focus:bg-white"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            const d = new Date(date + "T00:00:00Z");
            d.setUTCDate(d.getUTCDate() - 1);
            update(d.toISOString().slice(0, 10));
          }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          ← เมื่อวาน
        </button>
        <button
          type="button"
          onClick={() => update(new Date().toISOString().slice(0, 10))}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          วันนี้
        </button>
        <button
          type="button"
          onClick={() => {
            const d = new Date(date + "T00:00:00Z");
            d.setUTCDate(d.getUTCDate() + 1);
            update(d.toISOString().slice(0, 10));
          }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          พรุ่งนี้ →
        </button>
      </div>
    </div>
  );
}
