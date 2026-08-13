-- Add a name snapshot so redemption history/coupons stay readable after the
-- underlying Reward/Voucher catalog item is deleted, then let rewardId go
-- null on delete instead of blocking the delete with a FK violation.
ALTER TABLE "redemptions" ADD COLUMN "rewardName" TEXT;

UPDATE "redemptions" r
SET "rewardName" = w.name
FROM "rewards" w
WHERE r."rewardId" = w.id;

ALTER TABLE "redemptions" ALTER COLUMN "rewardName" SET NOT NULL;

ALTER TABLE "redemptions" DROP CONSTRAINT "redemptions_rewardId_fkey";
ALTER TABLE "redemptions" ALTER COLUMN "rewardId" DROP NOT NULL;
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
