-- CreateTable
CREATE TABLE "catering_booking_items" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catering_booking_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "catering_booking_items" ADD CONSTRAINT "catering_booking_items_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "catering_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
