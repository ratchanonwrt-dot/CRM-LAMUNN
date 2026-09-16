import clsx from "clsx";
import { formatNum } from "@/lib/format";

export interface HeatmapCell {
  value: number | null; // null = ไม่มีข้อมูล
  hint?: string;
}

/**
 * Heatmap สีเดียว (sequential: brand อ่อน -> เข้ม) ตัวเลขในช่องเป็นสีตัวอักษรปกติเสมอ
 * rows x cols — ใช้กับ "คนไลฟ์ x ชั่วโมง" และ "วัน x ชั่วโมง"
 */
export default function Heatmap({
  rowLabels,
  colLabels,
  cells, // cells[rowIndex][colIndex]
  valueFormatter = (v) => formatNum(v),
  compact = false,
}: {
  rowLabels: string[];
  colLabels: string[];
  cells: HeatmapCell[][];
  valueFormatter?: (v: number) => string;
  compact?: boolean;
}) {
  const values = cells.flat().map((c) => c.value).filter((v): v is number => v !== null && v > 0);
  const max = values.length ? Math.max(...values) : 0;
  const steps = ["bg-brand-50 text-muted", "bg-brand-100 text-ink/80", "bg-brand-200 text-ink", "bg-brand-300 text-gray-900", "bg-brand-500 text-white", "bg-brand-700 text-white"];
  const stepOf = (v: number) => {
    if (max <= 0) return steps[0];
    const t = v / max;
    return steps[Math.min(steps.length - 1, Math.floor(t * (steps.length - 0.001)))];
  };
  return (
    <div className="w-full overflow-x-auto">
      <table className="border-separate border-spacing-[2px] text-[11px]">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white" />
            {colLabels.map((c) => (
              <th key={c} className={clsx("font-normal text-stone-400", compact ? "min-w-[26px]" : "min-w-[34px]")}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowLabels.map((r, ri) => (
            <tr key={r}>
              <th className="sticky left-0 z-10 max-w-[140px] truncate bg-white pr-2 text-left font-medium text-muted">{r}</th>
              {colLabels.map((c, ci) => {
                const cell = cells[ri]?.[ci];
                const v = cell?.value ?? null;
                return (
                  <td
                    key={c}
                    title={cell?.hint ?? (v === null ? `${r} · ${c}: ไม่มีข้อมูล` : `${r} · ${c}: ${valueFormatter(v)}`)}
                    className={clsx(
                      "rounded-[4px] text-center tabular-nums",
                      compact ? "h-6" : "h-8",
                      v === null ? "bg-paper text-gray-200" : stepOf(v)
                    )}
                  >
                    {v === null ? "·" : compact ? "" : valueFormatter(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {max > 0 && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-stone-400">
          <span>น้อย</span>
          {steps.map((s) => (
            <span key={s} className={clsx("h-3 w-5 rounded-[3px]", s.split(" ")[0])} />
          ))}
          <span>มาก</span>
        </div>
      )}
    </div>
  );
}
