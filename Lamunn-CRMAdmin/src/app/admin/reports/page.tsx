import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@lamunn/db";
import { format } from "date-fns";

const typeLabel: Record<string, string> = {
  EARN: "รับแต้ม",
  REDEEM: "แลกรางวัล",
  ADJUST: "ปรับปรุง",
  VOID: "ยกเลิกรายการ",
};

export default async function ReportsPage({ searchParams }: { searchParams: { branchId?: string } }) {
  const session = await getServerSession(authOptions);
  const role = session!.user.role!;
  const myBranchId = session!.user.branchId;

  const effectiveBranchId = role === "SUPER_ADMIN" ? searchParams.branchId : myBranchId ?? undefined;

  const [transactions, branches] = await Promise.all([
    prisma.pointTransaction.findMany({
      where: effectiveBranchId ? { branchId: effectiveBranchId } : {},
      include: { branch: true, customer: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    role === "SUPER_ADMIN" ? prisma.branch.findMany({ orderBy: { code: "asc" } }) : Promise.resolve([]),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">รายงานธุรกรรม (ล่าสุด 100 รายการ)</h1>

      {role === "SUPER_ADMIN" && (
        <form className="mb-4 flex gap-2" method="get">
          <select name="branchId" defaultValue={searchParams.branchId ?? ""} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">ทุกสาขา</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} — {b.name}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">
            กรอง
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">วันที่</th>
              <th className="px-4 py-2">ประเภท</th>
              <th className="px-4 py-2">สาขา</th>
              <th className="px-4 py-2">ลูกค้า</th>
              <th className="px-4 py-2">ใบเสร็จ</th>
              <th className="px-4 py-2">ยอดซื้อ</th>
              <th className="px-4 py-2">แต้ม</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-500">{format(tx.createdAt, "d MMM yyyy HH:mm")}</td>
                <td className="px-4 py-2">{typeLabel[tx.type] ?? tx.type}</td>
                <td className="px-4 py-2 text-gray-500">{tx.branch?.code ?? "-"}</td>
                <td className="px-4 py-2 text-gray-500">{tx.customer.name ?? tx.customer.phone ?? tx.customerId.slice(0, 8)}</td>
                <td className="px-4 py-2 font-mono text-gray-500">{tx.receiptNo ?? "-"}</td>
                <td className="px-4 py-2 text-gray-500">{tx.amount ? Number(tx.amount).toLocaleString() : "-"}</td>
                <td className={tx.points >= 0 ? "px-4 py-2 font-medium text-brand-700" : "px-4 py-2 font-medium text-red-600"}>
                  {tx.points >= 0 ? "+" : ""}
                  {tx.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
