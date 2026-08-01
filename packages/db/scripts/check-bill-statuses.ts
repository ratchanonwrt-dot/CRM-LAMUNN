import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const statuses: any[] = await prisma.$queryRawUnsafe(
    `SELECT status, count(*) FROM public.pos_bills GROUP BY status;`
  );
  console.log("status breakdown:", statuses);

  const voided: any[] = await prisma.$queryRawUnsafe(
    `SELECT bill_no, status, void_reason, voided_at, total FROM public.pos_bills
     WHERE status != 'completed' LIMIT 5;`
  );
  console.log("non-completed examples:", voided);
}
main().finally(() => prisma.$disconnect());
