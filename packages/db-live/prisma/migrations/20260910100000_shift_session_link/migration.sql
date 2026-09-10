-- AlterTable
ALTER TABLE "live_shifts" ADD COLUMN     "sessionId" TEXT;

-- CreateIndex
CREATE INDEX "live_shifts_sessionId_idx" ON "live_shifts"("sessionId");

-- AddForeignKey
ALTER TABLE "live_shifts" ADD CONSTRAINT "live_shifts_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

