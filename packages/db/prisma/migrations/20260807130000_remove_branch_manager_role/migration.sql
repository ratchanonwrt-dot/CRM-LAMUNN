-- Postgres has no direct "remove enum value" — swap in a new enum type that
-- excludes BRANCH_MANAGER (no row in staff_users/audit_logs/role_permissions
-- references it at this point, confirmed before writing this migration).
BEGIN;

CREATE TYPE "StaffRole_new" AS ENUM ('SUPER_ADMIN', 'STAFF', 'MARKETING');

ALTER TABLE "staff_users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "staff_users" ALTER COLUMN "role" TYPE "StaffRole_new" USING ("role"::text::"StaffRole_new");
ALTER TABLE "staff_users" ALTER COLUMN "role" SET DEFAULT 'STAFF';

ALTER TABLE "audit_logs" ALTER COLUMN "staffRole" TYPE "StaffRole_new" USING ("staffRole"::text::"StaffRole_new");

ALTER TABLE "role_permissions" ALTER COLUMN "role" TYPE "StaffRole_new" USING ("role"::text::"StaffRole_new");

DROP TYPE "StaffRole";
ALTER TYPE "StaffRole_new" RENAME TO "StaffRole";

COMMIT;
