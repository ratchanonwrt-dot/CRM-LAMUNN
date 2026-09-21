import { prisma } from "@lamunn/db-finance";

export const CATERING_VAT_RATE = 0.07;

// totalAmount ของ booking = ผลรวมรายการ (ก่อน VAT) x 1.07 เสมอ ทันทีที่มีการแก้รายการ — ให้ตรงกับ
// "ยอดสุดท้าย" ที่โชว์ในหน้ารายละเอียดงาน (รวม VAT 7% แล้ว) ไม่ใช่แค่ยอดก่อน VAT
export async function recomputeBookingTotal(bookingId: string) {
  const items = await prisma.cateringBookingItem.findMany({ where: { bookingId } });
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const total = Math.round(subtotal * (1 + CATERING_VAT_RATE) * 100) / 100;
  await prisma.cateringBooking.update({ where: { id: bookingId }, data: { totalAmount: total } });
}
