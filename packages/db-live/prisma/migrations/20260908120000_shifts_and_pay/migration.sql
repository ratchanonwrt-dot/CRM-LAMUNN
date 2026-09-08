-- AlterTable
ALTER TABLE "live_slots" ADD COLUMN     "shiftId" TEXT;

-- CreateTable
CREATE TABLE "live_shifts" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "streamerId" TEXT NOT NULL,
    "channelId" TEXT,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "note" TEXT,
    "createdByStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pay_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "shippingPct" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "commissionPct" DOUBLE PRECISION NOT NULL DEFAULT 4,
    "minHourly" DOUBLE PRECISION NOT NULL DEFAULT 250,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pay_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "live_shifts_date_idx" ON "live_shifts"("date");

-- CreateIndex
CREATE INDEX "live_shifts_streamerId_idx" ON "live_shifts"("streamerId");

-- CreateIndex
CREATE INDEX "live_slots_shiftId_idx" ON "live_slots"("shiftId");

-- AddForeignKey
ALTER TABLE "live_slots" ADD CONSTRAINT "live_slots_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "live_shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_shifts" ADD CONSTRAINT "live_shifts_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "streamers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_shifts" ADD CONSTRAINT "live_shifts_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_shifts" ADD CONSTRAINT "live_shifts_createdByStaffId_fkey" FOREIGN KEY ("createdByStaffId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

