-- AlterTable
ALTER TABLE "catering_bookings" ADD COLUMN "needsBooth" BOOLEAN NOT NULL DEFAULT false;

-- DropForeignKey
ALTER TABLE "catering_booking_staff" DROP CONSTRAINT "catering_booking_staff_staffId_fkey";

-- DropIndex
DROP INDEX "catering_booking_staff_bookingId_staffId_key";

-- AlterTable
ALTER TABLE "catering_booking_staff" ALTER COLUMN "staffId" DROP NOT NULL,
ALTER COLUMN "roleLabel" DROP NOT NULL,
ADD COLUMN "staffName" TEXT;

-- AddForeignKey
ALTER TABLE "catering_booking_staff" ADD CONSTRAINT "catering_booking_staff_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill staffName for existing rows so they keep displaying correctly under the new name-only UI
UPDATE "catering_booking_staff" cbs
SET "staffName" = su."name"
FROM "staff_users" su
WHERE cbs."staffId" = su."id" AND cbs."staffName" IS NULL;
