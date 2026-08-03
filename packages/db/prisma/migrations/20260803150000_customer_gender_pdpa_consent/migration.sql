-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE', 'LGBTQ', 'UNSPECIFIED');

-- AlterTable
ALTER TABLE "customers" ADD COLUMN "gender" "Gender";
ALTER TABLE "customers" ADD COLUMN "pdpaConsentedAt" TIMESTAMP(3);
