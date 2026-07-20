import { Prisma } from "@prisma/client";
import { prisma } from "./client";

/**
 * Finds the active PointRule to apply for a branch at a given time: a branch-specific
 * rule takes priority over the global default (branchId = null). When multiple rules
 * match, the most recently made effective one wins.
 */
export async function resolvePointRule(branchId: string, at: Date = new Date()) {
  const branchRule = await prisma.pointRule.findFirst({
    where: {
      branchId,
      isActive: true,
      effectiveFrom: { lte: at },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: at } }],
    },
    orderBy: { effectiveFrom: "desc" },
  });
  if (branchRule) return branchRule;

  const globalRule = await prisma.pointRule.findFirst({
    where: {
      branchId: null,
      isActive: true,
      effectiveFrom: { lte: at },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: at } }],
    },
    orderBy: { effectiveFrom: "desc" },
  });
  return globalRule;
}

/** Converts a THB sale amount into points using a resolved PointRule. Points are
 * always floored — no fractional points are ever awarded. */
export function calculatePoints(amount: number, rule: { bahtPerPoint: Prisma.Decimal | number; minAmount: Prisma.Decimal | number }) {
  const bahtPerPoint = Number(rule.bahtPerPoint);
  const minAmount = Number(rule.minAmount);
  if (bahtPerPoint <= 0) return 0;
  if (amount < minAmount) return 0;
  return Math.floor(amount / bahtPerPoint);
}
