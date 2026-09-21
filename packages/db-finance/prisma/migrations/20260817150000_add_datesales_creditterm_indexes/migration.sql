-- CreateIndex
CREATE INDEX "daily_sales_date_idx" ON "daily_sales"("date");

-- CreateIndex
CREATE INDEX "credit_term_payments_branchId_idx" ON "credit_term_payments"("branchId");

-- CreateIndex
CREATE INDEX "credit_term_payments_dueDate_idx" ON "credit_term_payments"("dueDate");
