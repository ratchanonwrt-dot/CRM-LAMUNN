-- CreateTable
CREATE TABLE "b2b_customers" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "note" TEXT,
    "totalSpend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_tiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minSpend" DECIMAL(12,2) NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_purchases" (
    "id" TEXT NOT NULL,
    "b2bCustomerId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "processedByStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "b2b_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "b2b_purchases_b2bCustomerId_idx" ON "b2b_purchases"("b2bCustomerId");

-- AddForeignKey
ALTER TABLE "b2b_purchases" ADD CONSTRAINT "b2b_purchases_b2bCustomerId_fkey" FOREIGN KEY ("b2bCustomerId") REFERENCES "b2b_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_purchases" ADD CONSTRAINT "b2b_purchases_processedByStaffId_fkey" FOREIGN KEY ("processedByStaffId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
