import Link from "next/link";
import { prisma } from "@lamunn/db-catering";
import { requirePageRole } from "@/lib/requirePageRole";
import AddPackageForm from "@/components/AddPackageForm";
import { formatBaht } from "@/lib/format";

export default async function PackagesPage() {
  await requirePageRole(["SUPER_ADMIN", "MANAGER"]);
  const packages = await prisma.cateringPackage.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">แพคเกจจัดเลี้ยง ({packages.length})</h1>

      <AddPackageForm />

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">ชื่อแพคเกจ</th>
              <th className="px-4 py-2">รายละเอียด</th>
              <th className="px-4 py-2">ราคา</th>
              <th className="px-4 py-2">สถานะ</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {packages.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-4 py-2 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-2 text-gray-500">{p.description ?? "-"}</td>
                <td className="px-4 py-2 text-gray-700">{formatBaht(p.price)} บาท</td>
                <td className="px-4 py-2">
                  <span className={p.isActive ? "text-emerald-600" : "text-gray-400"}>
                    {p.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <Link href={`/packages/${p.id}`} className="text-brand-600 hover:underline">
                    แก้ไข
                  </Link>
                </td>
              </tr>
            ))}
            {packages.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  ยังไม่มีแพคเกจ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
