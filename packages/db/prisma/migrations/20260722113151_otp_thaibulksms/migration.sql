-- AlterTable
ALTER TABLE "otp_codes" ADD COLUMN     "token" TEXT,
ALTER COLUMN "codeHash" DROP NOT NULL;
