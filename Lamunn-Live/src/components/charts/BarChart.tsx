import clsx from "clsx";
import { formatNum } from "@/lib/format";

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  /** ข้อความใน tooltip (title) */
  hint?: string;
  /** แถวที่ไม่มีข้อมูล — วาดเป็นช่องว่างจาง ๆ */
  empty?: boolean;
}

/**
 * แท่งแนวตั้งชุดเดียว (single series) — สี brand เดียว, แท่งที่สูงสุดเข้มกว่า, label เฉพาะค่าสูงสุดกับที่ผู้ใช้ hover
 * ไม่ใช้ไลบรารีกราฟ: CSS grid + flex ล้วน ทำให้เป็น server component ได้
 */
export default function BarChart({
  data,
  valueFormatter = (v) => formatNum(v),
  height = 160,
  labelEvery = 1,
}: {
  data: BarDatum[];
  valueFormatter?: (v: number) => string;
  height?: number;
  labelEvery?: number;
}) {
  const max = Math.max(0, ...data.map((d) => d.value));
  const maxKey = data.find((d) => d.value === max && max > 0)?.key;
  return (
    <div className="w-full overflow-x-auto">
      {/* pt-6 เผื่อที่ให้ป้ายตัวเลขเหนือแท่งที่สูงสุด — ไม่งั้นโดน overflow ของกรอบเลื่อนตัดทิ้ง */}
      <div className="flex min-w-[520px] items-end gap-[3px] pt-6" style={{ height }}>
        {data.map((d) => {
          const pct = max > 0 ? (d.value / max) * 100 : 0;
          const isMax = d.key === maxKey;
          return (
            <div key={d.key} className="group relative flex h-full flex-1 flex-col justify-end" title={d.hint ?? `${d.label}: ${valueFormatter(d.value)}`}>
              <span
                className={clsx(
                  "pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] tabular-nums transition",
                  // แท่งสูงสุดโชว์ตัวเลขค้างไว้ (สีตัวอักษรปกติ) ส่วนแท่งอื่นโชว์เป็น tooltip ตอน hover
                  isMax ? "font-semibold text-gray-700" : "rounded bg-gray-800 px-1.5 py-0.5 text-white opacity-0 group-hover:opacity-100"
                )}
                style={{ bottom: `calc(${pct}% + 3px)` }}
              >
                {d.value > 0 ? valueFormatter(d.value) : ""}
              </span>
              <div
                className={clsx(
                  "w-full rounded-t-[4px] transition-colors",
                  d.empty || d.value === 0
                    ? "bg-gray-100"
                    : isMax
                      ? "bg-brand-600 group-hover:bg-brand-700"
                      : "bg-brand-300 group-hover:bg-brand-500"
                )}
                style={{ height: d.empty || d.value === 0 ? 2 : `${Math.max(pct, 1.5)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex min-w-[520px] gap-[3px] border-t border-gray-100 pt-1">
        {data.map((d, i) => (
          <div key={d.key} className="flex-1 text-center text-[10px] leading-tight text-gray-400">
            {i % labelEvery === 0 ? d.label : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
