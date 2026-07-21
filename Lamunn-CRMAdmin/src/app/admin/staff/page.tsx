import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@lamunn/db";
import AddStaffForm from "@/components/AddStaffForm";
import StaffRow from "@/components/StaffRow";

export default async function StaffPage() {
  const session = await getServerSession(authOptions);
  const role = session!.user.role!;
  const myBranchId = session!.user.branchId;

  const [staffList, branches] = await Promise.all([
    prisma.staffUser.findMany({
      where: role === "BRANCH_MANAGER" ? { branchId: myBranchId ?? undefined } : {},
      include: { branch: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">จัดการพนักงาน</h1>

      <AddStaffForm
        branches={branches}
        canChooseRole={role === "SUPER_ADMIN"}
        fixedBranchId={role === "BRANCH_MANAGER" ? myBranchId ?? undefined : undefined}
      />

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">ชื่อ</th>
              <th className="px-4 py-2">อีเมล</th>
              <th className="px-4 py-2">บทบาท</th>
              <th className="px-4 py-2">สาขา</th>
              <th className="px-4 py-2">สถานะ</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((s) => (
              <StaffRow key={s.id} staff={s} branches={branches} canChooseRole={role === "SUPER_ADMIN"} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
