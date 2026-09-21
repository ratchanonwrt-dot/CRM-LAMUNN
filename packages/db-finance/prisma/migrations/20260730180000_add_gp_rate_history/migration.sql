CREATE TABLE "gp_rate_history" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "effectiveYear" INTEGER NOT NULL,
    "effectiveMonth" INTEGER NOT NULL,
    "gpPercentStorefront" DOUBLE PRECISION NOT NULL,
    "gpPercentDelivery" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gp_rate_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "gp_rate_history_branchId_effectiveYear_effectiveMonth_key" ON "gp_rate_history"("branchId", "effectiveYear", "effectiveMonth");

ALTER TABLE "gp_rate_history" ADD CONSTRAINT "gp_rate_history_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
