-- CreateEnum
CREATE TYPE "HeldDepositVatType" AS ENUM ('INCLUDES_VAT', 'EXCLUDES_VAT', 'NO_VAT');

-- AlterTable
ALTER TABLE "held_deposits" ADD COLUMN "vatType" "HeldDepositVatType";
