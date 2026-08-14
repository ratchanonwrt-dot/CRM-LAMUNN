-- Left NULL for all existing customers on purpose: this is what triggers the
-- one-time re-confirm-your-birthday prompt on their next login. New signups set
-- it immediately alongside dateOfBirth (see profile/scan routes).
ALTER TABLE "customers" ADD COLUMN "dateOfBirthConfirmedAt" TIMESTAMP(3);
