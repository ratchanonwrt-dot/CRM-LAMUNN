export function formatBaht(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatPercent(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return `${(n * 100).toLocaleString("th-TH", { maximumFractionDigits: 1 })}%`;
}

export function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const thaiMonths = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

export function thaiMonthLabel(year: number, monthIndex0: number): string {
  return `${thaiMonths[monthIndex0]} ${year + 543}`;
}

export function formatThaiDate(d: Date): string {
  return `${d.getUTCDate()} ${thaiMonths[d.getUTCMonth()]} ${d.getUTCFullYear() + 543}`;
}
