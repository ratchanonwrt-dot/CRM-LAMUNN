-- CreateIndex
CREATE INDEX "catering_bookings_eventDate_idx" ON "catering_bookings"("eventDate");

-- CreateIndex
CREATE INDEX "pickup_orders_pickupDate_idx" ON "pickup_orders"("pickupDate");

-- CreateIndex
CREATE INDEX "pickup_orders_orderDate_idx" ON "pickup_orders"("orderDate");
