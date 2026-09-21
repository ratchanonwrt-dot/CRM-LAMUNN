ALTER TABLE "staff_users" ADD COLUMN "isOwner" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "held_deposits" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "depositedAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "held_deposits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dividend_payments" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dividend_payments_pkey" PRIMARY KEY ("id")
);
