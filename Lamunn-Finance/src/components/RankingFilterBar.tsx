"use client";

import { useRouter } from "next/navigation";

type SortKey = "total" | "storefront" | "delivery";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function todayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

const PRESETS: { label: string; range: () => { start: string; end: string } }[] = [
  {
    label: "เดือนนี้",
    range: () => {
      const now = todayUtc();
      return { start: iso(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))), end: iso(now) };
    },
  },
  {
    label: "เดือนก่อน",
    range: () => {
      const now = todayUtc();
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
      return { start: iso(start), end: iso(end) };
    },
  },
  {
    label: "7 วันล่าสุด",
    range: () => {
      const now = todayUtc();
      return { start: iso(new Date(now.getTime() - 6 * 86400000)), end: iso(now) };
    },
  },
  {
    label: "30 วันล่าสุด",
    range: () => {
      const now = todayUtc();
      return { start: iso(new Date(now.getTime() - 29 * 86400000)), end: iso(now) };
    },
  },
  {
    label: "ปีนี้",
    range: () => {
      const now = todayUtc();
      return { start: iso(new Date(Date.UTC(now.getUTCFullYear(), 0, 1))), end: iso(now) };
    },
  },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "total", label: "รวมทั้งหมด" },
  { key: "storefront", label: "หน้าร้าน" },
  { key: "delivery", label: "Delivery" },
];

export default function RankingFilterBar({
  basePath,
  start,
  end,
  sort,
}: {
  basePath: string;
  start: string;
  end: string;
  sort: SortKey;
}) {
  const router = useRouter();

  function go(next: Partial<{ start: string; end: string; sort: SortKey }>) {
    const params = new URLSearchParams({ start, end, sort, ...next });
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="mb-5 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">จากวันที่</label>
          <input
            type="date"
            value={start}
            max={end}
            onChange={(e) => go({ start: e.target.value })}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">ถึงวันที่</label>
          <input
            type="date"
            value={end}
            min={start}
            onChange={(e) => go({ end: e.target.value })}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => go(p.range())}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">เรียงตาม:</span>
        <div className="flex gap-1.5">
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => go({ sort: o.key })}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                sort === o.key ? "bg-brand-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
