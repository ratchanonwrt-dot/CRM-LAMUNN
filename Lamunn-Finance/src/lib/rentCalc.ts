export interface RentConfigLike {
  rentType: "FIX_RATE" | "GP";
  gpPercentStorefront: number;
  gpPercentDelivery: number;
  fixRateAmount: number | null;
  minAmount: number | null;
}

export interface RentResult {
  gpAmount: number; // ค่าเช่าคิดจากยอดขาย (ก่อนเทียบ Minimum)
  rentAmount: number; // ค่าเช่าที่ต้องจ่ายจริง (หลังเทียบ Minimum / Fix Rate)
  minimumApplied: boolean; // ยอดขายไม่ถึง Minimum ต้องจ่ายเพิ่มเอง
  effectiveGpPercent: number | null; // ค่าเช่าจริง / ยอดขายรวม
  salesGapToMinimum: number; // ต้องขายหน้าร้านเพิ่มอีกเท่าไหร่ (บาท) ถึงจะถึง Minimum ด้วย GP ล้วน ๆ (0 ถ้าถึงแล้ว/ไม่มี Minimum)
}

/** ค่าเช่า = max(Minimum Guarantee, ยอดขาย x GP%) — หรือค่าเช่าคงที่ถ้าตั้งเป็น Fix Rate */
export function computeRent(config: RentConfigLike, storefrontSales: number, deliverySales: number): RentResult {
  if (config.rentType === "FIX_RATE") {
    const rentAmount = config.fixRateAmount ?? 0;
    const total = storefrontSales + deliverySales;
    return {
      gpAmount: rentAmount,
      rentAmount,
      minimumApplied: false,
      effectiveGpPercent: total > 0 ? rentAmount / total : null,
      salesGapToMinimum: 0,
    };
  }

  const gpAmount = storefrontSales * config.gpPercentStorefront + deliverySales * config.gpPercentDelivery;
  const total = storefrontSales + deliverySales;
  const minAmount = config.minAmount ?? 0;

  if (minAmount > 0 && gpAmount < minAmount) {
    // ยอดขายหน้าร้านต้องเพิ่มอีกเท่าไหร่ (สมมติยอด Delivery คงที่) กว่า GP ล้วน ๆ จะแตะ Minimum
    const gpNeededFromStorefront = minAmount - deliverySales * config.gpPercentDelivery;
    const storefrontSalesNeeded = config.gpPercentStorefront > 0 ? gpNeededFromStorefront / config.gpPercentStorefront : Infinity;
    const salesGapToMinimum = Math.max(0, storefrontSalesNeeded - storefrontSales);

    return {
      gpAmount,
      rentAmount: minAmount,
      minimumApplied: true,
      effectiveGpPercent: total > 0 ? minAmount / total : null,
      salesGapToMinimum,
    };
  }

  return {
    gpAmount,
    rentAmount: gpAmount,
    minimumApplied: false,
    effectiveGpPercent: total > 0 ? gpAmount / total : config.gpPercentStorefront,
    salesGapToMinimum: 0,
  };
}
