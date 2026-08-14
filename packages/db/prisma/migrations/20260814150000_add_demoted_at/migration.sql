-- Gates instant lifetimePoints-based promotion after a demotion, so a customer
-- doesn't bounce straight back up to their old tier on the very next cron run
-- (lifetimePoints never decreases, so without this flag demotion would have no
-- real effect for any customer who ever previously qualified for that tier).
ALTER TABLE "customers" ADD COLUMN "demotedAt" TIMESTAMP(3);
