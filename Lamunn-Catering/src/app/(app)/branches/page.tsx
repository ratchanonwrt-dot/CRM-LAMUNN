import Link from "next/link";
import { prisma } from "@lamunn/db-catering";
import { requirePageRole } from "@/lib/requirePageRole";
import AddBranchForm from "@/components/AddBranchForm";

export default async function BranchesPage() {
  await requirePageRole(["SUPER_ADMIN", "MANAGER"]);
  const branches = await prisma.branch.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">สาขา / จุดรับของ ({branches.length})</h1>

      <AddBranchForm />

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[500px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">ชื่อสาขา</th>
              <th className="px-4 py-2">สถานะ</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.id} className="border-t border-gray-100">
                <td className="px-4 py-2 font-medium text-gray-800">{b.name}</td>
                <td className="px-4 py-2">
                  <span className={b.isActive ? "text-emerald-600" : "text-gray-400"}>
                    {b.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <Link href={`/branches/${b.id}`} className="text-brand-600 hover:underline">
                    แก้ไข
                  </Link>
                </td>
              </tr>
            ))}
            {branches.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                  ยังไม่มีสาขา
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
