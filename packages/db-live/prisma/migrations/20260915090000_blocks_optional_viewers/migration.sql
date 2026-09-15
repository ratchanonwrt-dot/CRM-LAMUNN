-- AlterTable
ALTER TABLE "live_slots" ALTER COLUMN "viewers" DROP NOT NULL;

-- CreateTable
CREATE TABLE "schedule_blocks" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "channelId" TEXT,
    "label" TEXT NOT NULL DEFAULT 'unavailable',
    "note" TEXT,
    "createdByStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedule_blocks_date_idx" ON "schedule_blocks"("date");

-- AddForeignKey
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_createdByStaffId_fkey" FOREIGN KEY ("createdByStaffId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

