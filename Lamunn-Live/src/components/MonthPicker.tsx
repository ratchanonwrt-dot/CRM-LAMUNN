"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { thaiMonthLabel } from "@/lib/format";

export default function MonthPicker({ year, month }: { year: number; month: number }) {
  const router = useRouter();
  const pathname = usePathname();

  function go(delta: number) {
    const d = new Date(Date.UTC(year, month + delta, 1));
    router.push(`${pathname}?month=${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }

  return (
    <div className="flex items-center rounded-2xl border border-line bg-white shadow-card">
      <button onClick={() => go(-1)} aria-label="เดือนก่อน" className="px-2 py-2 text-muted hover:bg-paper">
        <ChevronLeft size={16} />
      </button>
      <span className="min-w-[130px] text-center text-sm font-medium text-ink/80">{thaiMonthLabel(year, month)}</span>
      <button onClick={() => go(1)} aria-label="เดือนถัดไป" className="px-2 py-2 text-muted hover:bg-paper">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
