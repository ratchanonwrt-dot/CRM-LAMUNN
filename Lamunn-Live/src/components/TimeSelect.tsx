"use client";

import clsx from "clsx";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));

/**
 * ช่องเลือกเวลาแบบ 24 ชม. (ชั่วโมง : นาที) — ใช้แทน <input type="time"> ที่เบราว์เซอร์บางเครื่องโชว์ AM/PM
 * value เป็น "HH:mm" หรือ "" (ว่าง)
 */
export default function TimeSelect({
  value,
  onChange,
  required,
  minuteStep = 15,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minuteStep?: 5 | 10 | 15 | 30;
  className?: string;
}) {
  const [h, m] = value ? value.split(":") : ["", ""];
  const minutes = Array.from({ length: 60 / minuteStep }, (_, i) => String(i * minuteStep).padStart(2, "0"));
  // ค่านาทีที่ไม่ตรง step (เช่นข้อมูลเก่า 17:20) ยังต้องแสดงได้
  const minuteOptions = m && !minutes.includes(m) ? [...minutes, m].sort() : minutes;
  const selectCls = clsx("rounded-xl border border-line bg-white px-2 py-2.5 text-sm tabular-nums text-ink outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10", className);

  function update(nh: string, nm: string) {
    if (!nh) return onChange("");
    onChange(`${nh}:${nm || "00"}`);
  }

  return (
    <div className="flex items-center gap-1">
      <select required={required} value={h} onChange={(e) => update(e.target.value, m)} className={clsx(selectCls, "flex-1")} aria-label="ชั่วโมง">
        <option value="">--</option>
        {HOURS.map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </select>
      <span className="text-stone-400">:</span>
      <select value={m} disabled={!h} onChange={(e) => update(h, e.target.value)} className={clsx(selectCls, "flex-1 disabled:opacity-50")} aria-label="นาที">
        {minuteOptions.map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </select>
    </div>
  );
}
