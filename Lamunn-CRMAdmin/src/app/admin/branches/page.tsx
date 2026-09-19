import { prisma, syncBranchesFromPosThrottled } from "@lamunn/db";
import AddBranchForm from "@/components/AddBranchForm";
import ToggleActiveButton from "@/components/ToggleActiveButton";
import { requirePageRole } from "@/lib/requirePageRole";

export default async function BranchesPage() {
  await requirePageRole("branches");
  // Pull in anything new from the POS before listing (throttled — see posBranches.ts).
  const sync = await syncBranchesFromPosThrottled();
  const branches = await prisma.branch.findMany({ orderBy: { code: "asc" } });

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-800">จัดการสาขา ({branches.length} สาขา)</h1>
      <p className="mb-6 text-sm text-gray-500">
        สาขาใหม่ใน POS/IMS จะถูกเพิ่มที่นี่ให้อัตโนมัติ (เช็คทุกครั้งที่เปิดหน้านี้ และทุกคืน) — เปิด/ปิดตาม POS
        {sync && sync.created.length > 0 && <span className="ml-2 font-bold text-emerald-700">เพิ่งเพิ่ม: {sync.created.join(", ")}</span>}
        {sync && sync.unknownToPos.length > 0 && (
          <span className="ml-2 font-bold text-amber-700">ยังไม่มีใน POS (สแกนบิลไม่ได้จนกว่า POS จะเพิ่ม): {sync.unknownToPos.join(", ")}</span>
        )}
      </p>

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
