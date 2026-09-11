-- AlterTable
ALTER TABLE "channels" ADD COLUMN     "publicBooking" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "slot_requests" ADD COLUMN     "isReturning" BOOLEAN NOT NULL DEFAULT false;

