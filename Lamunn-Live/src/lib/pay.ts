/** อัตราค่าตอบแทนคนไลฟ์ (ค่าเริ่มต้นตรงกับ PaySetting ในฐานข้อมูล) */
export interface PaySettings {
  shippingPct: number; // หักค่าส่ง/ค่าส่งออกจากยอดขายก่อน (%)
  commissionPct: number; // คอมมิชชั่นจากยอดหลังหัก (%)
  minHourly: number; // ขั้นต่ำต่อชั่วโมง (บาท)
}

export const DEFAULT_PAY: PaySettings = { shippingPct: 20, commissionPct: 4, minHourly: 250 };

/** แอดมินกำหนดยอดจ่ายรวมเอง -> แทนที่ pay ที่คำนวณได้ (ตัวเลขอื่นคงไว้ให้เทียบ) */
export function applyOverride(result: PayResult, override: number | null): PayResult & { overridden: boolean; computedPay: number } {
  if (override === null) return { ...result, overridden: false, computedPay: result.pay };
  return {
    ...result,
    pay: override,
    topUp: override - result.commission,
    hitMinimum: false,
    effectivePct: result.net > 0 ? (override / result.net) * 100 : null,
    overridden: true,
    computedPay: result.pay,
  };
}

export interface PayResult {
  sales: number; // ยอดขายที่กรอก
  net: number; // ยอดหลังหักค่าส่ง
  commission: number; // คอมมิชชั่นตาม % ปกติ
  hours: number; // ชั่วโมงที่ใช้คิดขั้นต่ำ
  minPay: number; // ขั้นต่ำที่ต้องจ่าย = ชั่วโมง x อัตราขั้นต่ำ
  pay: number; // จ่ายจริง = max(คอมมิชชั่น, ขั้นต่ำ)
  topUp: number; // ส่วนที่ต้องจ่ายเพิ่มจากคอมมิชชั่นเพื่อให้ถึงขั้นต่ำ (0 ถ้าคอมมิชชั่นถึงอยู่แล้ว)
  hitMinimum: boolean; // true = คอมมิชชั่นไม่ถึงขั้นต่ำ ต้องจ่ายตามขั้นต่ำแทน
  effectivePct: number | null; // จ่ายจริงคิดเป็นกี่ % ของยอดหลังหัก (null ถ้ายอดเป็นศูนย์)
  breakEvenSales: number; // ยอดขาย (ก่อนหัก) ที่คอมมิชชั่น % ปกติจะพอดีขั้นต่ำ
}

/**
 * คิดค่าตอบแทน 1 กะ:
 *   net = sales x (1 - shipping%)
 *   commission = net x commission%
 *   pay = max(commission, hours x minHourly)
 *   effectivePct = pay / net  ->  "ตกลงเราเสียคอมมิชชั่นกี่ % จริง ๆ เพื่อให้ครบขั้นต่ำ"
 */
export function computePay(sales: number, hours: number, s: PaySettings): PayResult {
  const net = Math.max(0, sales) * (1 - s.shippingPct / 100);
  const commission = net * (s.commissionPct / 100);
  const minPay = Math.max(0, hours) * s.minHourly;
  const hitMinimum = commission < minPay;
  const pay = hitMinimum ? minPay : commission;
  const netFactor = (1 - s.shippingPct / 100) * (s.commissionPct / 100);
  return {
    sales,
    net,
    commission,
    hours,
    minPay,
    pay,
    topUp: hitMinimum ? minPay - commission : 0,
    hitMinimum,
    effectivePct: net > 0 ? (pay / net) * 100 : null,
    breakEvenSales: netFactor > 0 ? minPay / netFactor : 0,
  };
}

export function sumPay(results: PayResult[]): PayResult {
  const sales = results.reduce((a, r) => a + r.sales, 0);
  const net = results.reduce((a, r) => a + r.net, 0);
  const commission = results.reduce((a, r) => a + r.commission, 0);
  const hours = results.reduce((a, r) => a + r.hours, 0);
  const minPay = results.reduce((a, r) => a + r.minPay, 0);
  const pay = results.reduce((a, r) => a + r.pay, 0);
  return {
    sales,
    net,
    commission,
    hours,
    minPay,
    pay,
    topUp: pay - commission,
    hitMinimum: pay > commission,
    effectivePct: net > 0 ? (pay / net) * 100 : null,
    breakEvenSales: 0,
  };
}
