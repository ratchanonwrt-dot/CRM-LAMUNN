ALTER TABLE "rent_payments" ADD COLUMN "minimumPaid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "rent_payments" ADD COLUMN "minimumPaidAt" TIMESTAMP(3);
