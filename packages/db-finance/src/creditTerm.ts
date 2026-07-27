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

// monthIndex0 is 0-based (0 = January), matching JS Date conventions.
function addMonthsClampDay(year: number, monthIndex0: number, monthOffset: number, day: number): Date {
  const target = new Date(Date.UTC(year, monthIndex0 + monthOffset, 1));
  const lastDayOfTarget = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfTarget);
  return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), clampedDay));
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
    return [{ periodStart, periodEnd, dueDate, label: "เต็มเดือน" }];
  }

  const p1Start = new Date(Date.UTC(year, monthIndex0, 1));
  const p1End = new Date(Date.UTC(year, monthIndex0, 15));
  const p1Due = addMonthsClampDay(year, monthIndex0, cycle.period1PayMonthOffset, cycle.period1PayDay ?? 30);

  const p2Start = new Date(Date.UTC(year, monthIndex0, 16));
  const p2End = new Date(Date.UTC(year, monthIndex0, lastDay));
  const p2Due = addMonthsClampDay(year, monthIndex0, cycle.period2PayMonthOffset, cycle.period2PayDay ?? 1);

  return [
    { periodStart: p1Start, periodEnd: p1End, dueDate: p1Due, label: "1-15" },
    { periodStart: p2Start, periodEnd: p2End, dueDate: p2Due, label: `16-${lastDay}` },
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

/** ยอดรับสุทธิ = ยอดขายรวม - หัก GP หน้าร้าน - หัก GP Delivery (ถ้ามี) - ค่าเปิด Vendor */
export function computeReceivable(input: ReceivableInput): ReceivableResult {
  if (input.grossStorefront === 0 && input.grossDelivery === 0) {
    return { gpDeductStorefront: 0, gpDeductDelivery: 0, vendorFeeDeduct: 0, netAmount: 0 };
  }
  const gpDeductStorefront = input.grossStorefront * input.gpPercentStorefront;
  const gpDeductDelivery = input.deductDeliveryGp ? input.grossDelivery * input.gpPercentDelivery : 0;
  const vendorFeeDeduct = input.vendorFeeMonthly;
  const netAmount = input.grossStorefront + input.grossDelivery - gpDeductStorefront - gpDeductDelivery - vendorFeeDeduct;
  return { gpDeductStorefront, gpDeductDelivery, vendorFeeDeduct, netAmount };
}
