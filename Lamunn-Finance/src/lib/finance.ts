import { prisma } from "@lamunn/db-finance";
import { parseDateOnly } from "@/lib/dates";
import { getSetting } from "@/lib/settings";

/** เงินสดสะสมที่ส่งกลับครัวกลาง = ยอดยกมา + เงินสดนับของสาขาที่ไม่ใช่ Credit Term + รายการปรับปรุงมือ (ปันผล/แก้ไข) ตั้งแต่วันยกมา */
export async function getCashOnHand(): Promise<{ balance: number; openingBalance: number; openingDate: Date }> {
  const openingBalance = await getSetting("cashOpeningBalance").then(Number);
  const openingDate = parseDateOnly(await getSetting("cashOpeningDate"));

  const cashBranches = await prisma.branch.findMany({ where: { type: "CASH" }, select: { id: true } });
  const [salesAgg, adjustmentAgg] = await Promise.all([
    prisma.dailySales.aggregate({
      where: { branchId: { in: cashBranches.map((b) => b.id) }, date: { gt: openingDate } },
      _sum: { cashCounted: true },
    }),
    prisma.cashAdjustment.aggregate({
      where: { date: { gt: openingDate } },
      _sum: { amount: true },
    }),
  ]);

  const balance = openingBalance + (salesAgg._sum.cashCounted ?? 0) + (adjustmentAgg._sum.amount ?? 0);
  return { balance, openingBalance, openingDate };
}

/** ยอดค้างรับรวมจากห้าง (Credit Term) ที่ยังไม่ชำระ ณ ตอนนี้ */
export async function getCreditTermOutstanding(): Promise<number> {
  const agg = await prisma.creditTermPayment.aggregate({
    where: { status: "PENDING" },
    _sum: { netAmount: true },
  });
  return agg._sum.netAmount ?? 0;
}
