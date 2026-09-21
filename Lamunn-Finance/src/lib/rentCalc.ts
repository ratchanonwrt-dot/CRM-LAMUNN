export interface RentConfigLike {
  rentType: "FIX_RATE" | "GP";
  gpPercentStorefront: number;
  gpPercentDelivery: number;
  fixRateAmount: number | null;
  minAmount: number | null;
  // true สำหรับห้างที่ Minimum Guarantee คิดจากยอดหน้าร้านอย่างเดียว — GP Delivery บวกเพิ่มเข้าไปทีหลัง
  // ไม่ถูกหักออกจาก/รวมเข้ากับ Minimum (ต่างจากค่าเริ่มต้นที่ Minimum เทียบกับยอด GP รวมหน้าร้าน+Delivery)
  minimumExcludesDelivery: boolean;
}

export interface RentResult {
  gpAmount: number; // ค่าเช่าคิดจากยอดขายรวมหน้าร้าน+Delivery (ก่อนเทียบ Minimum) — เพื่อเทียบ/แสดงผลเท่านั้น
  storefrontGpAmount: number; // ค่าเช่าจาก GP หน้าร้านล้วนๆ
  deliveryGpAmount: number; // ค่าเช่าจาก GP Delivery ล้วนๆ
  rentAmount: number; // ค่าเช่าที่ต้องจ่ายจริง (หลังเทียบ Minimum / Fix Rate)
  minimumApplied: boolean; // ยอดขายไม่ถึง Minimum ต้องจ่ายเพิ่มเอง
  effectiveGpPercent: number | null; // ค่าเช่าจริง / ยอดขายรวม
  salesGapToMinimum: number; // ต้องขายหน้าร้านเพิ่มอีกเท่าไหร่ (บาท) ถึงจะถึง Minimum ด้วย GP ล้วน ๆ (0 ถ้าถึงแล้ว/ไม่มี Minimum)
}

/** ค่าเช่า = max(Minimum Guarantee, ยอดขาย x GP%) — หรือค่าเช่าคงที่ถ้าตั้งเป็น Fix Rate
 *
 * ถ้า minimumExcludesDelivery = true (เช่น Central ทุกสาขายกเว้น Central Embassy): Minimum เทียบกับ
 * GP หน้าร้านอย่างเดียว แล้วบวก GP Delivery เพิ่มเข้าไปทีหลังเสมอ — ไม่ว่าจะถึง Minimum จากหน้าร้านแล้วหรือไม่ก็ตาม
 * ค่าเช่ารวม = max(minAmount, storefrontGP) + deliveryGP */
export function computeRent(config: RentConfigLike, storefrontSales: number, deliverySales: number): RentResult {
  if (config.rentType === "FIX_RATE") {
    const rentAmount = config.fixRateAmount ?? 0;
    const total = storefrontSales + deliverySales;
    return {
      gpAmount: rentAmount,
      storefrontGpAmount: rentAmount,
      deliveryGpAmount: 0,
      rentAmount,
      minimumApplied: false,
      effectiveGpPercent: total > 0 ? rentAmount / total : null,
      salesGapToMinimum: 0,
    };
  }

  const storefrontGpAmount = storefrontSales * config.gpPercentStorefront;
  const deliveryGpAmount = deliverySales * config.gpPercentDelivery;
  const gpAmount = storefrontGpAmount + deliveryGpAmount;
  const total = storefrontSales + deliverySales;
  const minAmount = config.minAmount ?? 0;

  if (config.minimumExcludesDelivery) {
    const belowMinimum = minAmount > 0 && storefrontGpAmount < minAmount;
    const storefrontRent = belowMinimum ? minAmount : storefrontGpAmount;
    const rentAmount = storefrontRent + deliveryGpAmount;
    const salesGapToMinimum = belowMinimum
      ? config.gpPercentStorefront > 0
        ? Math.max(0, (minAmount - storefrontGpAmount) / config.gpPercentStorefront)
        : Infinity
      : 0;

    return {
      gpAmount,
      storefrontGpAmount,
      deliveryGpAmount,
      rentAmount,
      minimumApplied: belowMinimum,
      effectiveGpPercent: storefrontSales > 0 ? storefrontRent / storefrontSales : null,
      salesGapToMinimum,
    };
  }

  if (minAmount > 0 && gpAmount < minAmount) {
    // ยอดขายหน้าร้านต้องเพิ่มอีกเท่าไหร่ (สมมติยอด Delivery คงที่ตามอัตราจริง) กว่า GP ล้วน ๆ จะแตะ Minimum
    const gpNeededFromStorefront = minAmount - deliveryGpAmount;
    const storefrontSalesNeeded = config.gpPercentStorefront > 0 ? gpNeededFromStorefront / config.gpPercentStorefront : Infinity;
    const salesGapToMinimum = Math.max(0, storefrontSalesNeeded - storefrontSales);

    // GP ที่ "จ่ายจริง" เทียบเป็น % — สมมติ Delivery คิด GP คงที่ 10% (มาตรฐานกลาง ไม่ใช้อัตราตามสัญญาจริงของแต่ละสาขา)
    // แล้วเอาส่วนที่เหลือของ Minimum มาหารกับยอดหน้าร้าน เพื่อดูว่าหน้าร้านต้องแบก GP กี่ % ถึงจะครบ Minimum
    const ASSUMED_DELIVERY_GP_FOR_EFFECTIVE_RATE = 0.1;
    const deliveryGpAssumed = deliverySales * ASSUMED_DELIVERY_GP_FOR_EFFECTIVE_RATE;
    const gpNeededFromStorefrontAtAssumedRate = minAmount - deliveryGpAssumed;
    const effectiveGpPercent = storefrontSales > 0 ? gpNeededFromStorefrontAtAssumedRate / storefrontSales : null;

    return {
      gpAmount,
      storefrontGpAmount,
      deliveryGpAmount,
      rentAmount: minAmount,
      minimumApplied: true,
      effectiveGpPercent,
      salesGapToMinimum,
    };
  }

  return {
    gpAmount,
    storefrontGpAmount,
    deliveryGpAmount,
    rentAmount: gpAmount,
    minimumApplied: false,
    effectiveGpPercent: total > 0 ? gpAmount / total : config.gpPercentStorefront,
    salesGapToMinimum: 0,
  };
}
