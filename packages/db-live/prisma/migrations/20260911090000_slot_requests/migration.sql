-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "slot_requests" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "channelId" TEXT,
    "requesterName" TEXT NOT NULL,
    "requesterPhone" TEXT NOT NULL,
    "requesterLine" TEXT,
    "note" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "streamerId" TEXT,
    "shiftId" TEXT,
    "reviewedByStaffId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slot_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "slot_requests_shiftId_key" ON "slot_requests"("shiftId");

-- CreateIndex
CREATE INDEX "slot_requests_date_idx" ON "slot_requests"("date");

-- CreateIndex
CREATE INDEX "slot_requests_status_idx" ON "slot_requests"("status");

-- CreateIndex
CREATE INDEX "slot_requests_requesterPhone_idx" ON "slot_requests"("requesterPhone");

-- AddForeignKey
ALTER TABLE "slot_requests" ADD CONSTRAINT "slot_requests_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slot_requests" ADD CONSTRAINT "slot_requests_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "streamers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slot_requests" ADD CONSTRAINT "slot_requests_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "live_shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slot_requests" ADD CONSTRAINT "slot_requests_reviewedByStaffId_fkey" FOREIGN KEY ("reviewedByStaffId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

