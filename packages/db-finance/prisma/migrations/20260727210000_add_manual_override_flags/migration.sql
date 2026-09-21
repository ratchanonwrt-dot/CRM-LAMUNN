-- Manual-override flags: when true, the automatic POS/IMS sync must not overwrite that field
ALTER TABLE "daily_sales" ADD COLUMN "storefrontOverride" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "daily_sales" ADD COLUMN "grabOverride" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "daily_sales" ADD COLUMN "linemanOverride" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "company_channel_daily" ADD COLUMN "tiktokOverride" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "company_channel_daily" ADD COLUMN "fbLineOverride" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "company_channel_daily" ADD COLUMN "pickupOverride" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "company_channel_daily" ADD COLUMN "cateringOverride" BOOLEAN NOT NULL DEFAULT false;
