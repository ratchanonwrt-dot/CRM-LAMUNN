"use client";

import { useRouter } from "next/navigation";
import { thaiMonthLabel } from "@/lib/format";

export default function MonthFilterBar({
  basePath,
  year,
  month,
}: {
  basePath: string;
  year: number;
  month: number; // 1-12
}) {
  const router = useRouter();

  function go(y: number, m: number) {
    router.push(`${basePath}?year=${y}&month=${m}`);
  }

  function prev() {
    if (month === 1) go(year - 1, 12);
    else go(year, month - 1);
  }
  function next() {
    if (month === 12) go(year + 1, 1);
    else go(year, month + 1);
  }

  return (
    <div className="mb-5 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <button type="button" onClick={prev} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
        ← เดือนก่อน
      </button>
      <span className="min-w-[9rem] text-center text-sm font-semibold text-gray-800">{thaiMonthLabel(year, month - 1)}</span>
      <button type="button" onClick={next} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
        เดือนถัดไป →
      </button>
    </div>
  );
}
