import { prisma } from "@lamunn/db-finance";

type WhtDocNoClient = Pick<typeof prisma, "accWhtCertificate">;

/** เลขที่หนังสือรับรองรันต่อเนื่องต่อเดือน เช่น WHT-6909-0004 */
export async function nextWhtDocNo(payDate: Date, db: WhtDocNoClient = prisma): Promise<string> {
  const be = (payDate.getUTCFullYear() + 543) % 100;
  const mm = String(payDate.getUTCMonth() + 1).padStart(2, "0");
  const head = `WHT-${String(be).padStart(2, "0")}${mm}-`;
  const last = await db.accWhtCertificate.findFirst({
    where: { docNo: { startsWith: head } },
    orderBy: { docNo: "desc" },
    select: { docNo: true },
  });
  const seq = last ? Number(last.docNo.slice(head.length)) + 1 : 1;
  return `${head}${String(seq).padStart(4, "0")}`;
}
