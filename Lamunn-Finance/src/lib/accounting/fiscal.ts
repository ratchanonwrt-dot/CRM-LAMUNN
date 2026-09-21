/** วันเริ่มรอบบัญชีที่ครอบคลุมวันที่ `d` — ใช้คำนวณคอลัมน์ "สะสมตั้งแต่ต้นรอบบัญชี" ในงบกำไรขาดทุน
 * startMonth = 1 คือรอบบัญชีมกราคม–ธันวาคม (ค่าเริ่มต้น) */
export function fiscalYearStart(d: Date, startMonth: number): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const startYear = m >= startMonth ? y : y - 1;
  return new Date(Date.UTC(startYear, startMonth - 1, 1));
}

/** ป้ายกำกับรอบบัญชี เช่น "1 ม.ค. 2569 – 31 ส.ค. 2569" */
const SHORT_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export function shortThaiDate(d: Date): string {
  return `${d.getUTCDate()} ${SHORT_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear() + 543}`;
}
