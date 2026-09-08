import { prisma } from "@lamunn/db-live";
import { DEFAULT_PAY, type PaySettings } from "@/lib/pay";

/** อ่านอัตราค่าตอบแทน (สร้างแถว default ให้ถ้ายังไม่มี) */
export async function getPaySettings(): Promise<PaySettings & { updatedAt: Date }> {
  const row = await prisma.paySetting.findUnique({ where: { id: "default" } });
  return row ?? (await prisma.paySetting.create({ data: { id: "default", ...DEFAULT_PAY } }));
}
