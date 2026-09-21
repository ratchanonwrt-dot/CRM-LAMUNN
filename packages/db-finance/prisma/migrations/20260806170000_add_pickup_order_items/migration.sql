-- Pickup orders: add a scheduled pickup time, make the old free-text item description
-- optional (kept for existing rows), and add a proper line-items table like catering bookings have
ALTER TABLE "pickup_orders" ADD COLUMN "pickupTime" TEXT;
ALTER TABLE "pickup_orders" ALTER COLUMN "itemsDescription" DROP NOT NULL;

CREATE TABLE "pickup_order_items" (
    "id" TEXT NOT NULL,
    "pickupOrderId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pickup_order_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "pickup_order_items" ADD CONSTRAINT "pickup_order_items_pickupOrderId_fkey" FOREIGN KEY ("pickupOrderId") REFERENCES "pickup_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
