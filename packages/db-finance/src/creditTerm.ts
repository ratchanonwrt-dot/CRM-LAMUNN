// Pure calculation helpers for Credit Term (ห้างหัก GP แล้วโอนทีหลัง) receivable cycles.
// Kept dependency-free (no Prisma calls) so both the API routes and any script can reuse them.

export interface CreditTermCycleLike {
  splitMonth: boolean;
  period1PayDay: number | null;
  period1PayMonthOffset: number;
  period2PayDay: number | null;
  period2PayMonthOffset: number;
  fullMonthPayDay: number | null;
  fullMonthPayMonthOffset: number;
  deductDeliveryGp: boolean;
}

export interface PeriodWindow {
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  label: string;
}

// ถ้าวันครบกำหนดตรงเสาร์-อาทิตย์ ห้างจะโอนวันจันทร์ถัดไปแทน (ธนาคารไม่ทำการวันหยุด)
function shiftWeekendToMonday(d: Date): Date {
  const day = d.getUTCDay(); // 0 = อาทิตย์, 6 = เสาร์
  if (day === 6) return new Date(d.getTime() + 2 * 86400000);
  if (day === 0) return new Date(d.getTime() + 1 * 86400000);
  return d;
}

// monthIndex0 is 0-based (0 = January), matching JS Date conventions.
function addMonthsClampDay(year: number, monthIndex0: number, monthOffset: number, day: number): Date {
  const target = new Date(Date.UTC(year, monthIndex0 + monthOffset, 1));
  const lastDayOfTarget = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfTarget);
  return shiftWeekendToMonday(new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), clampedDay)));
}

/** Returns the one or two receivable periods (with due dates) that fall in the given month. */
export function computePeriodsForMonth(
  cycle: CreditTermCycleLike,
  year: number,
  monthIndex0: number
): PeriodWindow[] {
  const lastDay = new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();

  if (!cycle.splitMonth) {
    const periodStart = new Date(Date.UTC(year, monthIndex0, 1));
    const periodEnd = new Date(Date.UTC(year, monthIndex0, lastDay));
    const dueDate = addMonthsClampDay(year, monthIndex0, cycle.fullMonthPayMonthOffset, cycle.fullMonthPayDay ?? 25);
    return [{ periodStart, periodEnd, dueDate, label: "งวด 1-สิ้นเดือน" }];
  }

  const p1Start = new Date(Date.UTC(year, monthIndex0, 1));
  const p1End = new Date(Date.UTC(year, monthIndex0, 15));
  const p1Due = addMonthsClampDay(year, monthIndex0, cycle.period1PayMonthOffset, cycle.period1PayDay ?? 30);

  const p2Start = new Date(Date.UTC(year, monthIndex0, 16));
  const p2End = new Date(Date.UTC(year, monthIndex0, lastDay));
  const p2Due = addMonthsClampDay(year, monthIndex0, cycle.period2PayMonthOffset, cycle.period2PayDay ?? 1);

  return [
    { periodStart: p1Start, periodEnd: p1End, dueDate: p1Due, label: "งวด 1-15" },
    { periodStart: p2Start, periodEnd: p2End, dueDate: p2Due, label: "งวด 16-สิ้นเดือน" },
  ];
}

export interface ReceivableInput {
  grossStorefront: number;
  grossDelivery: number;
  gpPercentStorefront: number;
  gpPercentDelivery: number;
  vendorFeeMonthly: number;
  deductDeliveryGp: boolean;
}

export interface ReceivableResult {
  gpDeductStorefront: number;
  gpDeductDelivery: number;
  vendorFeeDeduct: number;
  netAmount: number;
}

/**
 * ยอดรับสุทธิ (ที่ห้างค้างจ่ายเรา) = ยอดขายหน้าร้าน (เงินสด+โอน) - หัก GP หน้าร้าน - หัก GP Delivery (ถ้ามี) - ค่าเปิด Vendor
 * ไม่รวมยอดขาย Delivery (Grab/Lineman) เข้าไปในยอดรับ เพราะเงินส่วนนั้นโอนเข้าบัญชีเราตรงทุกวันอยู่แล้ว —
 * ห้างหักแค่ค่า GP ของ Delivery ออกจากยอดหน้าร้านที่ห้างถืออยู่เท่านั้น
 */
export function computeReceivable(input: ReceivableInput): ReceivableResult {
  if (input.grossStorefront === 0 && input.grossDelivery === 0) {
    return { gpDeductStorefront: 0, gpDeductDelivery: 0, vendorFeeDeduct: 0, netAmount: 0 };
  }
  const gpDeductStorefront = input.grossStorefront * input.gpPercentStorefront;
  const gpDeductDelivery = input.deductDeliveryGp ? input.grossDelivery * input.gpPercentDelivery : 0;
  const vendorFeeDeduct = input.vendorFeeMonthly;
  const netAmount = input.grossStorefront - gpDeductStorefront - gpDeductDelivery - vendorFeeDeduct;
  return { gpDeductStorefront, gpDeductDelivery, vendorFeeDeduct, netAmount };
}
