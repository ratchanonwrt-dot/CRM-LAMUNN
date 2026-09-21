-- AlterEnum
-- Must be its own migration: Postgres won't let a new enum value be used
-- (e.g. in an INSERT) within the same transaction that added it.
ALTER TYPE "StaffRole" ADD VALUE 'CATERING_STAFF';
