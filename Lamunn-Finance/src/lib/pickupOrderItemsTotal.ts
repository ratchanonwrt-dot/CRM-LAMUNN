import { prisma } from "@lamunn/db-finance";

// amount ของออเดอร์ = ผลรวมรายการเสมอ ทันทีที่มีการแก้รายการ (ไม่บวก VAT — ต่างจาก Catering booking
// ที่ยอดสุดท้ายรวม VAT 7% เพราะออเดอร์รับที่ร้านไม่ได้ขอให้คิด VAT)
export async function recomputePickupOrderAmount(pickupOrderId: string) {
  const items = await prisma.pickupOrderItem.findMany({ where: { pickupOrderId } });
  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  await prisma.pickupOrder.update({ where: { id: pickupOrderId }, data: { amount: total } });
}
