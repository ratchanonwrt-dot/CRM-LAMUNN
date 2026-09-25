/** แปลงเปอร์เซ็นต์ที่ผู้ใช้เห็น (เช่น 3) เป็นหน่วย basis point ก่อนคำนวณ
 * เพื่อให้ยอดเงินปัดครั้งเดียวเป็นสตางค์และไม่สะสมเศษจาก float */
export function withholdingFromPercent(baseSatang: number, percentInput: string | number) {
  const rawPercent = typeof percentInput === "number" ? percentInput : Number(percentInput);
  const basisPoints = Number.isFinite(rawPercent) ? Math.round(rawPercent * 100) : 0;
  const amount = Math.round((baseSatang * basisPoints) / 10_000);
  return {
    percent: basisPoints / 100,
    rate: basisPoints / 10_000,
    amount,
  };
}
