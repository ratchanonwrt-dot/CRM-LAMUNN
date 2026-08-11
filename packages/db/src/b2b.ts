import { prisma } from "./client";
import type { B2BTier } from "@prisma/client";

export async function getB2BTiers() {
  return prisma.b2BTier.findMany({ orderBy: { minSpend: "asc" } });
}

/** Highest tier the given cumulative spend qualifies for, or null if below the lowest threshold. */
export function resolveB2BTier(totalSpend: number, tiers: B2BTier[]): B2BTier | null {
  const sorted = [...tiers].sort((a, b) => Number(a.minSpend) - Number(b.minSpend));
  let current: B2BTier | null = null;
  for (const tier of sorted) {
    if (totalSpend >= Number(tier.minSpend)) current = tier;
  }
  return current;
}

/** The next tier above the current spend, if any — for "อีก X บาทถึงเทียร์ถัดไป" UI. */
export function nextB2BTier(totalSpend: number, tiers: B2BTier[]): B2BTier | null {
  const sorted = [...tiers].sort((a, b) => Number(a.minSpend) - Number(b.minSpend));
  return sorted.find((tier) => Number(tier.minSpend) > totalSpend) ?? null;
}
