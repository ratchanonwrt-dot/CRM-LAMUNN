-- One-time setup — run this once in the Supabase SQL editor (as the project
-- owner / postgres role), NOT with the lamunn_crm_user role.
--
-- lamunn_crm_user only has privileges on the schemas it was granted, so it can't
-- create the new "lamunn_live" schema itself. Same pattern as lamunn_finance /
-- lamunn_catering.
--
-- After running this once, `npm run live:migrate` (from the repo root) can create
-- all the tables inside lamunn_live normally.
CREATE SCHEMA IF NOT EXISTS lamunn_live;
GRANT ALL ON SCHEMA lamunn_live TO lamunn_crm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA lamunn_live GRANT ALL ON TABLES TO lamunn_crm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA lamunn_live GRANT ALL ON SEQUENCES TO lamunn_crm_user;
