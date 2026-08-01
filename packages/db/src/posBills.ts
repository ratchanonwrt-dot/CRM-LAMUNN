import { prisma } from "./client";

/**
 * Read-only bridge into the POS's own database (public.branches / public.pos_bills),
 * granted via a scoped, read-only RLS policy on those two tables only. This package
 * never writes to those tables — only SELECT, and only these two.
 */
export type PosBillLookup = {
  status: string;
  total: number;
  voidedAt: Date | null;
} | null;

export async function lookupPosBill(branchCode: string, receiptNo: string): Promise<PosBillLookup> {
  const rows = await prisma.$queryRaw<{ status: string; total: unknown; voided_at: Date | null }[]>`
    SELECT pb.status, pb.total, pb.voided_at
    FROM public.pos_bills pb
    JOIN public.branches b ON b.id = pb.branch_id
    WHERE b.code = ${branchCode} AND pb.bill_no = ${receiptNo}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return { status: row.status, total: Number(row.total), voidedAt: row.voided_at };
}

/**
 * Finds recent EARN transactions whose POS bill has since been voided (scanned
 * before the void happened), and reverses the points. Only looks at the last
 * `lookbackDays` since a void that happens weeks after a scan is out of scope —
 * that's a manual admin/refund case, not this automated check.
 */
export async function reconcileVoidedBills(lookbackDays = 14): Promise<{ checked: number; reversed: number }> {
  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
  const candidates = await prisma.pointTransaction.findMany({
    where: { type: "EARN", voidedInPos: false, receiptNo: { not: null }, branchId: { not: null }, createdAt: { gte: since } },
    include: { branch: true },
  });

  let reversed = 0;
  for (const tx of candidates) {
    if (!tx.branch || !tx.receiptNo) continue;
    const bill = await lookupPosBill(tx.branch.code, tx.receiptNo);
    if (!bill || bill.status !== "void") continue;

    await prisma.$transaction(async (db) => {
      const customer = await db.customer.findUnique({ where: { id: tx.customerId } });
      if (!customer) return;
      const deduction = Math.min(tx.points, customer.pointsBalance);
      if (deduction > 0) {
        await db.pointTransaction.create({
          data: {
            customerId: tx.customerId,
            branchId: tx.branchId,
            type: "VOID",
            points: -deduction,
            receiptNo: null, // avoid clashing with the unique (branchId, receiptNo) index of the original EARN row
            note: `บิล ${tx.receiptNo} ถูก void ในระบบ POS ภายหลัง — หักแต้มคืน (จากรายการ ${tx.id})`,
          },
        });
        await db.customer.update({ where: { id: tx.customerId }, data: { pointsBalance: { decrement: deduction } } });
      }
      await db.pointTransaction.update({ where: { id: tx.id }, data: { voidedInPos: true } });
    });
    reversed += 1;
  }

  return { checked: candidates.length, reversed };
}
