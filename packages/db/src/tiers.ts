import { prisma } from "./client";
import type { MembershipTier } from "@prisma/client";

export async function getMembershipTiers() {
  return prisma.membershipTier.findMany({ orderBy: { minPoints: "asc" } });
}

/** Returns the highest tier the given lifetime points qualifies for, or null if below the lowest threshold. */
export function resolveTier(lifetimePoints: number, tiers: MembershipTier[]): MembershipTier | null {
  const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
  let current: MembershipTier | null = null;
  for (const tier of sorted) {
    if (lifetimePoints >= tier.minPoints) current = tier;
  }
  return current;
}

/** The next tier above the customer's current one, if any — useful for "N points to go" UI. */
export function nextTier(lifetimePoints: number, tiers: MembershipTier[]): MembershipTier | null {
  const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
  return sorted.find((tier) => tier.minPoints > lifetimePoints) ?? null;
}
