import { prisma } from "../src/client";

async function main() {
  const bills: any[] = await prisma.$queryRawUnsafe(
    `SELECT b.code as branch_code, pb.bill_no, pb.total
     FROM public.pos_bills pb
     JOIN public.branches b ON b.id = pb.branch_id
     WHERE pb.status = 'completed'
     ORDER BY pb.created_at DESC
     LIMIT 20;`
  );

  for (const bill of bills) {
    const claimed = await prisma.pointTransaction.findFirst({
      where: { receiptNo: bill.bill_no, branch: { code: bill.branch_code } },
    });
    if (!claimed) {
      console.log("UNCLAIMED:", bill.branch_code, bill.bill_no, bill.total);
      return;
    }
  }
  console.log("none found unclaimed in top 20");
}
main().finally(() => prisma.$disconnect());
