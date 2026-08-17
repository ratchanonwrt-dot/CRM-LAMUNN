-- Employee code matching what each staff member uses to log into IMS, so the
-- two systems can be cross-referenced by the same identifier per branch.
ALTER TABLE "staff_users" ADD COLUMN "employeeCode" TEXT;
