-- CreateEnum
CREATE TYPE "BranchType" AS ENUM ('CASH', 'CREDIT_TERM');

-- CreateEnum
CREATE TYPE "RentType" AS ENUM ('FIX_RATE', 'GP');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('ADMIN', 'STAFF');

-- CreateTable
CREATE TABLE "staff_users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BranchType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rent_configs" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "rentType" "RentType" NOT NULL DEFAULT 'GP',
    "gpPercentStorefront" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gpPercentDelivery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fixRateAmount" DOUBLE PRECISION,
    "vendorFeeMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rent_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_term_cycle_configs" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "splitMonth" BOOLEAN NOT NULL DEFAULT true,
    "period1PayDay" INTEGER,
    "period1PayMonthOffset" INTEGER NOT NULL DEFAULT 0,
    "period2PayDay" INTEGER,
    "period2PayMonthOffset" INTEGER NOT NULL DEFAULT 1,
    "fullMonthPayDay" INTEGER,
    "fullMonthPayMonthOffset" INTEGER NOT NULL DEFAULT 1,
    "deductDeliveryGp" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_term_cycle_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_sales" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "cashPos" DOUBLE PRECISION,
    "cashCounted" DOUBLE PRECISION,
    "transfer" DOUBLE PRECISION,
    "cashTransferCombined" DOUBLE PRECISION,
    "grab" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lineman" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "posCheckTotal" DOUBLE PRECISION,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_channel_daily" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "tiktok" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fbLine" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pickup" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "catering" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "depositGrab" DOUBLE PRECISION,
    "depositLineman" DOUBLE PRECISION,
    "depositStorefront" DOUBLE PRECISION,
    "depositEcom" DOUBLE PRECISION,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_channel_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_term_payments" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "label" TEXT,
    "periodStart" DATE,
    "periodEnd" DATE,
    "grossStorefront" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossDelivery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gpDeductStorefront" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gpDeductDelivery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vendorFeeDeduct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "dueDate" DATE NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_term_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_sales" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "location" TEXT,
    "storefront" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grab" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lineman" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_users_email_key" ON "staff_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- CreateIndex
CREATE UNIQUE INDEX "rent_configs_branchId_key" ON "rent_configs"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "credit_term_cycle_configs_branchId_key" ON "credit_term_cycle_configs"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_sales_branchId_date_key" ON "daily_sales"("branchId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "company_channel_daily_date_key" ON "company_channel_daily"("date");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- AddForeignKey
ALTER TABLE "rent_configs" ADD CONSTRAINT "rent_configs_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_term_cycle_configs" ADD CONSTRAINT "credit_term_cycle_configs_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_sales" ADD CONSTRAINT "daily_sales_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_term_payments" ADD CONSTRAINT "credit_term_payments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

