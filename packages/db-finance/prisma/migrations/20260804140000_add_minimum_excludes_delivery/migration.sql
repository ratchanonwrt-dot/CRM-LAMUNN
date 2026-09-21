-- AlterTable
ALTER TABLE "rent_configs" ADD COLUMN "minimumExcludesDelivery" BOOLEAN NOT NULL DEFAULT false;

-- Central branches (except Central Embassy) — Minimum Guarantee compares against storefront GP only;
-- Delivery GP (10%) is added on top and never rolled into/absorbed by the Minimum comparison.
UPDATE "rent_configs" rc
SET "minimumExcludesDelivery" = true
FROM "branches" b
WHERE rc."branchId" = b."id"
  AND b."name" LIKE 'Central %'
  AND b."name" != 'Central Embassy';
