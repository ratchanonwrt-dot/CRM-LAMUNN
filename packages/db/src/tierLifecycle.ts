import { prisma } from "./client";
import { resolveTier } from "./tiers";
import type { MembershipTier } from "@prisma/client";

const MAINTENANCE_CYCLE_DAYS = 182; // ~6 months
const VOUCHER_GRANT_CYCLE_DAYS = 91; // ~3 months

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/** Highest tier whose maintenanceSpendThreshold the given window spend satisfies.
 * Only the floor tier (lowest minPoints, e.g. Bronze) is unconditionally safe when
 * its threshold is unset — every other tier needs a real configured threshold to
 * be reachable via spend. Without this, an admin who hasn't set a tier's threshold
 * yet (null) would have that tier treated as "always qualifies", and the walk-up
 * would sail straight past it to the next unset tier — in practice promoting
 * everyone to the top tier while thresholds are still being configured. */
function resolveMaintainedTier(windowSpend: number, tiers: MembershipTier[]): MembershipTier | null {
  const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
  let current: MembershipTier | null = sorted[0] ?? null;
  for (const tier of sorted) {
    if (tier.id === current?.id) continue;
    const threshold = tier.maintenanceSpendThreshold === null ? null : Number(tier.maintenanceSpendThreshold);
    if (threshold !== null && windowSpend >= threshold) current = tier;
  }
  return current;
}

/**
 * Runs the three per-customer tier lifecycle checks (see
 * Lamunn-CRM/src/app/api/cron/tier-lifecycle/route.ts for the daily cron that
 * calls this). Each check only acts on customers who are actually due, based on
 * their own anniversary/grant timestamps — not a fixed calendar date — so the
 * work spreads out naturally instead of stampeding on a shared schedule.
 */
export async function runTierLifecycle(options?: { customerIds?: string[] }) {
  const tiers = await prisma.membershipTier.findMany({ orderBy: { minPoints: "asc" } });
  if (tiers.length === 0) return { maintained: 0, promoted: 0, demoted: 0, voucherGrants: 0 };

  const customers = await prisma.customer.findMany({
    where: { isActive: true, ...(options?.customerIds ? { id: { in: options.customerIds } } : {}) },
    select: {
      id: true,
      lifetimePoints: true,
      currentTierId: true,
      tierAnniversaryAt: true,
      lastTierVoucherGrantAt: true,
      demotedAt: true,
    },
  });

  let promoted = 0;
  let demoted = 0;
  let maintained = 0;
  let voucherGrants = 0;
  const now = new Date();
  const maintenanceDueAt = daysAgo(MAINTENANCE_CYCLE_DAYS);
  const voucherDueAt = daysAgo(VOUCHER_GRANT_CYCLE_DAYS);

  for (const customer of customers) {
    let currentTierId = customer.currentTierId;
    let demotedAt = customer.demotedAt;
    let tierChangedThisRun = false;

    // 1. Maintenance / demotion — only customers whose 6-month anniversary is due.
    if (customer.tierAnniversaryAt === null || customer.tierAnniversaryAt <= maintenanceDueAt) {
      const windowStart = customer.tierAnniversaryAt ?? new Date(0);
      const spendAgg = await prisma.pointTransaction.aggregate({
        where: { customerId: customer.id, type: "EARN", amount: { not: null }, createdAt: { gte: windowStart } },
        _sum: { amount: true },
      });
      const windowSpend = Number(spendAgg._sum.amount ?? 0);
      const maintainedTier = resolveMaintainedTier(windowSpend, tiers);
      const currentTier = tiers.find((t) => t.id === currentTierId) ?? null;

      const maintainedRank = maintainedTier?.minPoints ?? -1;
      const currentRank = currentTier?.minPoints ?? -1;
      if (maintainedRank < currentRank) {
        // Demoted — flag it so step 2 can't instantly undo this using old
        // lifetimePoints (which never decreases) on the very next cron run.
        currentTierId = maintainedTier?.id ?? null;
        demotedAt = now;
        demoted++;
      } else if (maintainedRank > currentRank) {
        // Renewed spend earned them a real promotion the fair way — clear the
        // flag, they've proven current behavior supports it.
        currentTierId = maintainedTier?.id ?? null;
        demotedAt = null;
        promoted++;
      } else {
        maintained++;
      }
      tierChangedThisRun = true;
    }

    // 2. Instant promotion via lifetimePoints — skipped entirely once a customer
    // has been demoted, until they clear that flag via a fair spend-based
    // renewal above. Otherwise demotion would never stick: lifetimePoints only
    // ever grows, so this check would promote them right back the next run.
    if (demotedAt === null) {
      const naturalTier = resolveTier(customer.lifetimePoints, tiers);
      const currentRankAfterMaintenance = tiers.find((t) => t.id === currentTierId)?.minPoints ?? -1;
      if (naturalTier !== null && naturalTier.minPoints > currentRankAfterMaintenance) {
        currentTierId = naturalTier.id;
        tierChangedThisRun = true;
        promoted++;
      }
    }

    if (tierChangedThisRun || currentTierId !== customer.currentTierId || demotedAt !== customer.demotedAt) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { currentTierId, tierAnniversaryAt: now, demotedAt },
      });
    }

    // 3. Quarterly voucher grant — only customers due, whose (possibly just-updated) tier has a bundle.
    const dueForVoucherGrant = customer.lastTierVoucherGrantAt === null || customer.lastTierVoucherGrantAt <= voucherDueAt;
    if (dueForVoucherGrant && currentTierId) {
      const allTemplates = await prisma.tierVoucherTemplate.findMany({
        where: { tierId: currentTierId },
        include: { reward: true },
      });
      // Deactivating a voucher (e.g. promo ended) pauses it here too, without
      // admin needing to also remove it from the tier's template list.
      const templates = allTemplates.filter((t) => t.reward.isActive);
      if (templates.length > 0) {
        const expiresAt = new Date(now.getTime() + VOUCHER_GRANT_CYCLE_DAYS * 24 * 60 * 60 * 1000);
        await prisma.$transaction(
          templates.flatMap((template) =>
            Array.from({ length: template.quantity }, () =>
              prisma.redemption.create({
                data: {
                  customerId: customer.id,
                  rewardId: template.rewardId,
                  rewardName: template.reward.name,
                  pointsSpent: 0,
                  status: "PENDING",
                  expiresAt,
                },
              })
            )
          )
        );
        voucherGrants += templates.reduce((sum, t) => sum + t.quantity, 0);
        await prisma.customer.update({ where: { id: customer.id }, data: { lastTierVoucherGrantAt: now } });
      }
    }
  }

  return { maintained, promoted, demoted, voucherGrants };
}
