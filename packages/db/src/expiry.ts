import { prisma } from "./client";

export const POINTS_EXPIRY_DAYS = 365;

export function computeExpiryDate(from: Date = new Date()): Date {
  return new Date(from.getTime() + POINTS_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Finds EARN transactions whose expiry date has passed and haven't been
 * processed yet, voids them, and decrements the customer's balance (capped
 * at what's actually left — there's no FIFO ledger tracking which specific
 * earn batch funded a later redemption, so this is an approximation, not a
 * precise per-batch expiry).
 */
export async function expireOldPoints(customerId: string): Promise<void> {
  const now = new Date();
  const expiredRows = await prisma.pointTransaction.findMany({
    where: { customerId, type: "EARN", expired: false, expiresAt: { lte: now } },
  });
  if (expiredRows.length === 0) return;

  for (const row of expiredRows) {
    await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id: customerId } });
      if (!customer) return;
      const deduction = Math.min(row.points, customer.pointsBalance);
      if (deduction > 0) {
        await tx.pointTransaction.create({
          data: {
            customerId,
            type: "VOID",
            points: -deduction,
            note: `แต้มหมดอายุ (จากรายการ ${row.id})`,
          },
        });
        await tx.customer.update({ where: { id: customerId }, data: { pointsBalance: { decrement: deduction } } });
      }
      await tx.pointTransaction.update({ where: { id: row.id }, data: { expired: true } });
    });
  }
}

/** Returns the soonest-to-expire, not-yet-expired EARN batch, for display purposes. */
export async function getExpirySummary(customerId: string): Promise<{ points: number; expiresAt: Date } | null> {
  const soonest = await prisma.pointTransaction.findFirst({
    where: { customerId, type: "EARN", expired: false, expiresAt: { not: null } },
    orderBy: { expiresAt: "asc" },
  });
  if (!soonest || !soonest.expiresAt) return null;
  return { points: soonest.points, expiresAt: soonest.expiresAt };
}
