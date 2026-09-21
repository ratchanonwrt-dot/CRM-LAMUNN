-- CreateEnum
CREATE TYPE "PermissionSection" AS ENUM ('DASHBOARD', 'REPORTS', 'MONTHLY', 'CREDIT_TERM', 'RENT', 'CASH_STATUS', 'DEPOSITS', 'HELD_DEPOSITS', 'EVENTS', 'BRANCHES', 'RECONCILIATION', 'SETTINGS', 'CATERING');

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "section" "PermissionSection" NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_section_key" ON "role_permissions"("role", "section");

-- Seed default permissions replicating the exact hardcoded behavior this table replaces:
-- SUPER_ADMIN and MANAGER had full view+edit on every section (MANAGER via EDITOR_ROLES);
-- STAFF could view everything except BRANCHES/SETTINGS (those pages were EDITOR_ROLES-gated
-- even for viewing) and could never edit anything; CATERING_STAFF is brand new — Catering
-- only, view+edit, nothing else.
INSERT INTO "role_permissions" ("id", "role", "section", "canView", "canEdit", "updatedAt")
SELECT gen_random_uuid()::text, r.role, s.section, v.can_view, v.can_edit, CURRENT_TIMESTAMP
FROM (VALUES
  ('SUPER_ADMIN'::"StaffRole"),
  ('MANAGER'::"StaffRole"),
  ('STAFF'::"StaffRole"),
  ('CATERING_STAFF'::"StaffRole")
) AS r(role)
CROSS JOIN (VALUES
  ('DASHBOARD'::"PermissionSection"),
  ('REPORTS'::"PermissionSection"),
  ('MONTHLY'::"PermissionSection"),
  ('CREDIT_TERM'::"PermissionSection"),
  ('RENT'::"PermissionSection"),
  ('CASH_STATUS'::"PermissionSection"),
  ('DEPOSITS'::"PermissionSection"),
  ('HELD_DEPOSITS'::"PermissionSection"),
  ('EVENTS'::"PermissionSection"),
  ('BRANCHES'::"PermissionSection"),
  ('RECONCILIATION'::"PermissionSection"),
  ('SETTINGS'::"PermissionSection"),
  ('CATERING'::"PermissionSection")
) AS s(section)
CROSS JOIN LATERAL (
  SELECT
    CASE
      WHEN r.role IN ('SUPER_ADMIN', 'MANAGER') THEN true
      WHEN r.role = 'STAFF' AND s.section NOT IN ('BRANCHES', 'SETTINGS') THEN true
      WHEN r.role = 'CATERING_STAFF' AND s.section = 'CATERING' THEN true
      ELSE false
    END AS can_view,
    CASE
      WHEN r.role IN ('SUPER_ADMIN', 'MANAGER') THEN true
      WHEN r.role = 'CATERING_STAFF' AND s.section = 'CATERING' THEN true
      ELSE false
    END AS can_edit
) AS v;
