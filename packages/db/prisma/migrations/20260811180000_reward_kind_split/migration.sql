-- CreateEnum
CREATE TYPE "RewardKind" AS ENUM ('REWARD', 'VOUCHER');

-- AlterTable
ALTER TABLE "rewards"
  ADD COLUMN "kind" "RewardKind" NOT NULL DEFAULT 'REWARD',
  ALTER COLUMN "pointsCost" DROP NOT NULL;
