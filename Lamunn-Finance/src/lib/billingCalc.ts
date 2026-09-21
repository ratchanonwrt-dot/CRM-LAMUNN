// คำนวณยอดวางบิลเครือ The Mall Group — พนักงานกรอกยอดขายรวม VAT เอง (ไม่ใช้ยอดจาก POS)
// แยกคิดต่อช่องทาง (หน้าร้าน / Delivery) แล้วรวมเป็นยอดสุดท้ายที่ห้างต้องโอนคืน
// อ้างอิงสูตรจากไฟล์ Excel ตัวอย่างที่ใช้งานจริง (Invoice calculation.xlsx)

export const VAT_RATE = 0.07;
export const WHT_RATE = 0.03;

export interface ChannelBillingResult {
  salesIncVat: number;
  salesNoVat: number; // salesIncVat / 1.07
  gpNoVat: number; // salesNoVat x GP%
  gpVat: number; // gpNoVat x 7%
  totalDebt: number; // salesIncVat - gpNoVat - gpVat
  wht: number; // gpNoVat x 3%
  netTransfer: number; // totalDebt + wht (ยอดที่ห้างต้องโอนคืนช่องทางนี้ ถ้าคิดแยกช่องทางเดียว)
}

// applyWht = false สำหรับห้างที่ไม่หัก ณ ที่จ่าย (เช่น Central, Tops — ต่างจาก The Mall Group ที่หัก 3%)
export function computeChannelBilling(salesIncVat: number, gpPercent: number, applyWht = true): ChannelBillingResult {
  const salesNoVat = salesIncVat / (1 + VAT_RATE);
  const gpNoVat = salesNoVat * gpPercent;
  const gpVat = gpNoVat * VAT_RATE;
  const totalDebt = salesIncVat - gpNoVat - gpVat;
  const wht = applyWht ? gpNoVat * WHT_RATE : 0;
  const netTransfer = totalDebt + wht;
  return { salesIncVat, salesNoVat, gpNoVat, gpVat, totalDebt, wht, netTransfer };
}

export interface MallGroupBillingResult {
  storefront: ChannelBillingResult;
  delivery: ChannelBillingResult;
  // ยอดขาย Delivery ไม่ผ่านมือห้าง (โอนเข้าเราตรงจาก Grab/Lineman) — ห้างหักแค่ GP+VAT ของ Delivery
  // ออกจากยอดที่ต้องโอนคืนฝั่งหน้าร้าน แล้วบวกคืน WHT ของ Delivery กลับเข้ามา
  finalNetTransfer: number;
}

export function computeMallGroupBilling(
  storefrontSalesIncVat: number,
  deliverySalesIncVat: number,
  gpPercentStorefront: number,
  gpPercentDelivery: number,
  applyWht = true
): MallGroupBillingResult {
  const storefront = computeChannelBilling(storefrontSalesIncVat, gpPercentStorefront, applyWht);
  const delivery = computeChannelBilling(deliverySalesIncVat, gpPercentDelivery, applyWht);
  const finalNetTransfer = storefront.netTransfer - delivery.gpNoVat - delivery.gpVat + delivery.wht;
  return { storefront, delivery, finalNetTransfer };
}
