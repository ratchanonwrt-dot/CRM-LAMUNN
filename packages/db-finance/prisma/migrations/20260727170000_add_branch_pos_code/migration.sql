-- Link each Finance branch to the friend's POS Supabase branch record (public.branches.code)
ALTER TABLE "branches" ADD COLUMN "posCode" TEXT;
CREATE UNIQUE INDEX "branches_posCode_key" ON "branches"("posCode");
