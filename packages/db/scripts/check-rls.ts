import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  try {
    const rls: any[] = await prisma.$queryRawUnsafe(
      `SELECT relname, relrowsecurity, relforcerowsecurity
       FROM pg_class WHERE relname = 'branches' AND relnamespace = 'public'::regnamespace;`
    );
    console.log("RLS status:", rls);

    const policies: any[] = await prisma.$queryRawUnsafe(
      `SELECT policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename = 'branches' AND schemaname = 'public';`
    );
    console.log("Policies:", policies);

    const count: any[] = await prisma.$queryRawUnsafe(`SELECT count(*) FROM public.branches;`);
    console.log("count(*):", count);
  } catch (e: any) {
    console.error("failed:", e.message);
  }
}
main().finally(() => prisma.$disconnect());
