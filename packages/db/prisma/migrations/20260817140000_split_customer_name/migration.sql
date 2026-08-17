-- Splits the single free-text Customer.name field into firstName/lastName so
-- the onboarding/scan forms can collect them separately. Existing rows are
-- backfilled by splitting on the first space (good enough for the common
-- "ชื่อ นามสกุล" pattern; anything without a space becomes firstName only).
ALTER TABLE "customers" ADD COLUMN "firstName" TEXT;
ALTER TABLE "customers" ADD COLUMN "lastName" TEXT;

UPDATE "customers" SET
  "firstName" = CASE WHEN position(' ' in "name") > 0 THEN substring("name" from 1 for position(' ' in "name") - 1) ELSE "name" END,
  "lastName" = CASE WHEN position(' ' in "name") > 0 THEN NULLIF(trim(substring("name" from position(' ' in "name") + 1)), '') ELSE NULL END
WHERE "name" IS NOT NULL AND "name" != '';

ALTER TABLE "customers" DROP COLUMN "name";
