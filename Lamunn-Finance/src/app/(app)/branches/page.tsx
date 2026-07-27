import Link from "next/link";
import { prisma } from "@lamunn/db-finance";
import { requirePageRole } from "@/lib/requirePageRole";
import AddBranchForm from "@/components/AddBranchForm";
import { formatBaht, formatPercent } from "@/lib/format";

export default async function BranchesPage() {
  await requirePageRole(["ADMIN"]);
  const branches = await prisma.branch.findMany({ orderBy: { sortOrder: "asc" }, include: { rentConfig: true } });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">ตั้งค่าสาขา / ค่าเช่า ({branches.length})</h1>

      <AddBranchForm />

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">รหัส</th>
              <th className="px-4 py-2">ชื่อสาขา</th>
              <th className="px-4 py-2">ประเภท</th>
              <th className="px-4 py-2">ค่าเช่า</th>
              <th className="px-4 py-2">GP% หน้าร้าน / Delivery</th>
              <th className="px-4 py-2">สถานะ</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.id} className="border-t border-gray-100">
                <td className="px-4 py-2 font-mono">{b.code}</td>
                <td className="px-4 py-2 font-medium text-gray-800">{b.name}</td>
                <td className="px-4 py-2 text-gray-500">{b.type === "CREDIT_TERM" ? "Credit Term" : "เงินสด"}</td>
                <td className="px-4 py-2 text-gray-500">
                  {b.rentConfig?.rentType === "FIX_RATE"
                    ? `คงที่ ${formatBaht(b.rentConfig.fixRateAmount)} บาท/เดือน`
                    : "GP%"}
                </td>
                <td className="px-4 py-2 text-gray-500">
                  {formatPercent(b.rentConfig?.gpPercentStorefront)} / {formatPercent(b.rentConfig?.gpPercentDelivery)}
                </td>
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
