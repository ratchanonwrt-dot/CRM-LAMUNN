-- Credit Term: track actual amount received when closing a period, and carry any shortfall forward
ALTER TABLE "credit_term_payments" ADD COLUMN "receivedAmount" DOUBLE PRECISION;
ALTER TABLE "credit_term_payments" ADD COLUMN "shortfallAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "credit_term_payments" ADD COLUMN "shortfallResolved" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "credit_term_payments" ADD COLUMN "carriedInAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "credit_term_payments" ADD COLUMN "carriedFromId" TEXT;
