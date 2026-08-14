import { prisma } from "./client";

/**
 * Grants the reward mapped to `trigger` (via Reward.autoTrigger) to a customer,
 * unless that reward is inactive, doesn't exist, or was already granted once
 * before (checked by Redemption existence, optionally scoped to `sinceYear` for
 * annually-recurring triggers). Returns the created Redemption id, or null if
 * nothing was granted.
 */
async function grantOnce(
  customerId: string,
  trigger: "WELCOME" | "NEXT_PURCHASE" | "BIRTHDAY_MONTH",
  options?: { expiresAt?: Date; sinceYear?: boolean }
): Promise<string | null> {
  const reward = await prisma.reward.findUnique({ where: { autoTrigger: trigger } });
  if (!reward || !reward.isActive) return null;

  const yearStart = options?.sinceYear ? new Date(new Date().getFullYear(), 0, 1) : undefined;
  const existing = await prisma.redemption.findFirst({
    where: { customerId, rewardId: reward.id, ...(yearStart ? { createdAt: { gte: yearStart } } : {}) },
  });
  if (existing) return null;

  const redemption = await prisma.redemption.create({
    data: {
      customerId,
      rewardId: reward.id,
      rewardName: reward.name,
      pointsSpent: 0,
      status: "PENDING",
      expiresAt: options?.expiresAt ?? null,
    },
  });
  return redemption.id;
}

/**
 * Safe to call on every signup AND every subsequent login — the grantOnce
 * dedup check makes this a no-op after the first successful grant, so callers
 * don't need to track "is this customer actually new" themselves.
 */
export async function grantWelcomeCouponIfNeeded(customerId: string): Promise<void> {
  await grantOnce(customerId, "WELCOME");
}

/**
 * Called right after a Redemption is confirmed COMPLETED (see
 * Lamunn-CRMAdmin's redemption confirm route) — if that redemption was for
 * the WELCOME coupon, unlock the next-purchase coupon for the same customer.
 */
export async function grantNextPurchaseCouponIfWelcomeUsed(completedRedemptionId: string): Promise<void> {
  const redemption = await prisma.redemption.findUnique({
    where: { id: completedRedemptionId },
    include: { reward: true },
  });
  if (!redemption || redemption.reward?.autoTrigger !== "WELCOME") return;
  await grantOnce(redemption.customerId, "NEXT_PURCHASE");
}

/**
 * Run daily by the birthday-coupon cron. Grants once per calendar year to
 * every active customer whose confirmed date of birth falls in the current
 * month, expiring at the end of that month.
 */
export async function grantBirthdayCoupons(): Promise<{ granted: number }> {
  const now = new Date();
  const currentMonth = now.getUTCMonth();
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), currentMonth + 1, 0, 23, 59, 59, 999));

  const customers = await prisma.customer.findMany({
    where: { isActive: true, dateOfBirth: { not: null } },
    select: { id: true, dateOfBirth: true },
  });

  let granted = 0;
  for (const customer of customers) {
    if (customer.dateOfBirth!.getUTCMonth() !== currentMonth) continue;
    const id = await grantOnce(customer.id, "BIRTHDAY_MONTH", { expiresAt: monthEnd, sinceYear: true });
    if (id) granted++;
  }
  return { granted };
}
