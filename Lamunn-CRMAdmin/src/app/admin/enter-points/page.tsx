import { prisma } from "@lamunn/db";
import { format } from "date-fns";
import { requirePageRole } from "@/lib/requirePageRole";
import EnterPointsForm from "@/components/EnterPointsForm";

const ENTER_POINTS_NOTE_PREFIX = "กรอกคะแนนโดยพนักงาน";

export default async function EnterPointsPage({ searchParams }: { searchParams: { branchId?: string } }) {
  const user = await requirePageRole("enterPoints");
  const role = user.role!;
  const myBranchId = user.branchId;
  const isHqRole = role === "SUPER_ADMIN" || role === "MARKETING" || role === "SUPERVISOR";

  const effectiveBranchId = isHqRole ? searchParams.branchId : myBranchId ?? undefined;

  const [branches, log] = await Promise.all([
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.pointTransaction.findMany({
      where: {
        type: "ADJUST",
        note: { startsWith: ENTER_POINTS_NOTE_PREFIX },
        ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
      },
      include: { customer: true, branch: true, processedByStaff: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-xl font-bold text-gray-800">กรอกคะแนน</h1>
      <p className="mb-6 text-sm text-gray-500">กรอกเบอร์โทรลูกค้า จำนวนแต้ม และสาขา แต้มจะเข้าระบบทันที (ใช้สำหรับลูกค้าที่เป็นสมาชิกอยู่แล้วเท่านั้น)</p>
      <EnterPointsForm
        branches={branches.map((b) => ({ id: b.id, name: b.name }))}
        defaultBranchId={user.branchId ?? ""}
      />

      <h2 className="mb-2 mt-10 text-lg font-semibold text-gray-800">ประวัติการกรอกคะแนน (ล่าสุด 100 รายการ)</h2>

      {isHqRole && (
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

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">วันที่</th>
              <th className="px-4 py-2">พนักงานที่กรอก</th>
              <th className="px-4 py-2">เบอร์ลูกค้า</th>
              <th className="px-4 py-2">สาขา</th>
              <th className="px-4 py-2">แต้ม</th>
            </tr>
          </thead>
          <tbody>
            {log.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  ยังไม่มีรายการ
                </td>
              </tr>
            ) : (
              log.map((tx) => (
                <tr key={tx.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-500">{format(tx.createdAt, "d MMM yyyy HH:mm")}</td>
                  <td className="px-4 py-2">{tx.processedByStaff?.name ?? "-"}</td>
                  <td className="px-4 py-2 text-gray-500">{tx.customer.phone ?? "-"}</td>
                  <td className="px-4 py-2 text-gray-500">{tx.branch?.code ?? "-"}</td>
                  <td className="px-4 py-2 font-medium text-brand-700">+{tx.points}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
