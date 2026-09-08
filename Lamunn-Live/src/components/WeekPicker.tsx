"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** เลือกสัปดาห์ (จันทร์-อาทิตย์) ผ่าน query ?week=YYYY-MM-DD (วันจันทร์) */
export default function WeekPicker({ weekStart, label, isCurrent }: { weekStart: string; label: string; isCurrent: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  function go(deltaDays: number | null) {
    if (deltaDays === null) {
      router.push(pathname);
      return;
    }
    const d = new Date(weekStart + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + deltaDays);
    router.push(`${pathname}?week=${d.toISOString().slice(0, 10)}`);
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-xl border border-gray-200 bg-white">
        <button onClick={() => go(-7)} aria-label="สัปดาห์ก่อน" className="px-2 py-2 text-gray-500 hover:bg-gray-50">
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[190px] text-center text-sm font-medium text-gray-700">{label}</span>
        <button onClick={() => go(7)} aria-label="สัปดาห์ถัดไป" className="px-2 py-2 text-gray-500 hover:bg-gray-50">
          <ChevronRight size={16} />
        </button>
      </div>
      {!isCurrent && (
        <button onClick={() => go(null)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
          สัปดาห์นี้
        </button>
      )}
    </div>
  );
}
