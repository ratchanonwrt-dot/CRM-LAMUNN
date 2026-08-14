-- Tier maintenance threshold (null = no maintenance requirement, e.g. Bronze)
ALTER TABLE "membership_tiers" ADD COLUMN "maintenanceSpendThreshold" DECIMAL(10,2);

-- Customer's persisted effective tier (decoupled from lifetimePoints so it can be
-- demoted), plus the anniversary-window bookkeeping fields.
ALTER TABLE "customers" ADD COLUMN "currentTierId" TEXT;
ALTER TABLE "customers" ADD COLUMN "tierAnniversaryAt" TIMESTAMP(3);
ALTER TABLE "customers" ADD COLUMN "lastTierVoucherGrantAt" TIMESTAMP(3);
ALTER TABLE "customers" ADD CONSTRAINT "customers_currentTierId_fkey" FOREIGN KEY ("currentTierId") REFERENCES "membership_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Flat-amount discount fields on Reward, alongside the existing percent-based ones.
ALTER TABLE "rewards" ADD COLUMN "discountAmount" DECIMAL(10,2);
ALTER TABLE "rewards" ADD COLUMN "minSpendAmount" DECIMAL(10,2);

-- Recipe table: tier X grants N copies of voucher Y every 3-month cycle.
CREATE TABLE "tier_voucher_templates" (
    "id" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tier_voucher_templates_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "tier_voucher_templates" ADD CONSTRAINT "tier_voucher_templates_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "membership_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tier_voucher_templates" ADD CONSTRAINT "tier_voucher_templates_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: give every existing customer their currently-implied tier (same logic
-- as resolveTier() — highest tier whose minPoints they've reached) and a fresh
-- 6-month runway starting today, rather than evaluating them retroactively against
-- a maintenance rule that never existed before now (would mass-demote on day one).
UPDATE "customers" c SET "currentTierId" = (
  SELECT mt.id FROM "membership_tiers" mt
  WHERE mt."minPoints" <= c."lifetimePoints"
  ORDER BY mt."minPoints" DESC LIMIT 1
);
UPDATE "customers" SET "tierAnniversaryAt" = CURRENT_TIMESTAMP WHERE "currentTierId" IS NOT NULL;
