-- One-time setup — run this once in the Supabase SQL editor (as the project
-- owner / postgres role), NOT with the lamunn_crm_user role.
--
-- lamunn_crm_user only has privileges on the "lamunn_crm" schema, so it can't
-- create the new "lamunn_finance" schema itself (confirmed: has_database_privilege
-- for CREATE on the "postgres" database returns false for this role). This grants
-- it its own schema, matching the same separation already used for lamunn_crm.
--
-- After running this once, `npm run finance:migrate` (from the repo root) can
-- create all the tables inside lamunn_finance normally.

-- NOTE: no "AUTHORIZATION lamunn_crm_user" here — Supabase's SQL editor role
-- can't SET ROLE to a custom role to hand over ownership that way ("must be
-- able to SET ROLE"). Granting privileges on the schema (without changing its
-- owner) works fine instead — lamunn_crm_user will own the tables it creates
-- inside the schema once it runs the actual migration.
CREATE SCHEMA IF NOT EXISTS lamunn_finance;
GRANT ALL ON SCHEMA lamunn_finance TO lamunn_crm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA lamunn_finance GRANT ALL ON TABLES TO lamunn_crm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA lamunn_finance GRANT ALL ON SEQUENCES TO lamunn_crm_user;
