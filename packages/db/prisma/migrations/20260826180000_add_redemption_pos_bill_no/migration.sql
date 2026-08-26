-- POS bill number entered by staff when confirming a free voucher redemption,
-- so the per-transaction fraud check can look up that bill's real discount.
ALTER TABLE "redemptions" ADD COLUMN "posBillNo" TEXT;
