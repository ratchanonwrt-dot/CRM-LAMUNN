-- Expand StaffRole from (ADMIN, STAFF) to (SUPER_ADMIN, MANAGER, STAFF)
-- Existing ADMIN users become SUPER_ADMIN (they already had full access); STAFF stays STAFF.
ALTER TYPE "StaffRole" RENAME TO "StaffRole_old";
CREATE TYPE "StaffRole" AS ENUM ('SUPER_ADMIN', 'MANAGER', 'STAFF');

ALTER TABLE "staff_users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "staff_users" ALTER COLUMN "role" TYPE "StaffRole" USING (
  CASE "role"::text
    WHEN 'ADMIN' THEN 'SUPER_ADMIN'
    WHEN 'STAFF' THEN 'STAFF'
  END
)::"StaffRole";
ALTER TABLE "staff_users" ALTER COLUMN "role" SET DEFAULT 'STAFF';

DROP TYPE "StaffRole_old";
