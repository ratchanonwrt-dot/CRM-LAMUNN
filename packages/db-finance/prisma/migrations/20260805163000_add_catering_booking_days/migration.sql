-- Multi-day catering events: end date on the booking + a per-day breakdown table
ALTER TABLE "catering_bookings" ADD COLUMN "eventEndDate" DATE;

CREATE TABLE "catering_booking_days" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "servings" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catering_booking_days_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "catering_booking_days_bookingId_date_key" ON "catering_booking_days"("bookingId", "date");

ALTER TABLE "catering_booking_days" ADD CONSTRAINT "catering_booking_days_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "catering_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
