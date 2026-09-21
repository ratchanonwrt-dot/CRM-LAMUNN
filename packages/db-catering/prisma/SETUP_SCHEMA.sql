-- One-time setup — run this once in the Supabase SQL editor (as the project
-- owner / postgres role), NOT with the lamunn_crm_user role.
--
-- lamunn_crm_user only has privileges on the "lamunn_crm" schema, so it can't
-- create the new "lamunn_catering" schema itself. This grants it its own
-- schema, matching the same separation already used for lamunn_finance.
--
-- After running this once, `npm run catering:migrate` (from the repo root) can
-- create all the tables inside lamunn_catering normally.
CREATE SCHEMA IF NOT EXISTS lamunn_catering;
GRANT ALL ON SCHEMA lamunn_catering TO lamunn_crm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA lamunn_catering GRANT ALL ON TABLES TO lamunn_crm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA lamunn_catering GRANT ALL ON SEQUENCES TO lamunn_crm_user;
