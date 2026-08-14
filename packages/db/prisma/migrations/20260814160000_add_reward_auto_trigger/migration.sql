-- Marks a voucher as auto-granted by a specific customer-lifecycle event
-- (new signup / used-welcome-coupon / birthday month). At most one active
-- Reward can hold each trigger value (unique index below).
CREATE TYPE "RewardAutoTrigger" AS ENUM ('WELCOME', 'NEXT_PURCHASE', 'BIRTHDAY_MONTH');

ALTER TABLE "rewards" ADD COLUMN "autoTrigger" "RewardAutoTrigger";

CREATE UNIQUE INDEX "rewards_autoTrigger_key" ON "rewards"("autoTrigger");
