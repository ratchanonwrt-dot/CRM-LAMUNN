import { prisma } from "@lamunn/db";
import AddBranchForm from "@/components/AddBranchForm";
import ToggleActiveButton from "@/components/ToggleActiveButton";
import { requirePageRole } from "@/lib/requirePageRole";

export default async function BranchesPage() {
  await requirePageRole(["SUPER_ADMIN"]);
  const branches = await prisma.branch.findMany({ orderBy: { code: "asc" } });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">จัดการสาขา ({branches.length}/21)</h1>

      <AddBranchForm />

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">รหัส</th>
              <th className="px-4 py-2">ชื่อสาขา</th>
              <th className="px-4 py-2">ที่อยู่</th>
              <th className="px-4 py-2">เบอร์โทร</th>
              <th className="px-4 py-2">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.id} className="border-t border-gray-100">
                <td className="px-4 py-2 font-mono">{b.code}</td>
                <td className="px-4 py-2">{b.name}</td>
                <td className="px-4 py-2 text-gray-500">{b.address ?? "-"}</td>
                <td className="px-4 py-2 text-gray-500">{b.phone ?? "-"}</td>
                <td className="px-4 py-2">
                  <ToggleActiveButton endpoint={`/api/admin/branches/${b.id}`} isActive={b.isActive} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
