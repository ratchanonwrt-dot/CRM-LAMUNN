import { prisma } from "@lamunn/db-finance";
import EntryFilterBar from "@/components/EntryFilterBar";
import DailySalesForm from "@/components/DailySalesForm";
import { parseDateOnly } from "@/lib/dates";
import { formatBaht, formatThaiDate } from "@/lib/format";

export default async function DailyEntryPage({
  searchParams,
}: {
  searchParams: { branch?: string; date?: string };
}) {
  // ไม่กรอง isActive — ต้องยังกรอกยอดย้อนหลังให้สาขาที่ปิดไปแล้วได้
  const branches = await prisma.branch.findMany({ orderBy: { sortOrder: "asc" } });
  const branchCode = searchParams.branch ?? branches[0]?.code ?? "01";
  const date = searchParams.date ?? new Date().toISOString().slice(0, 10);

  const branch = branches.find((b) => b.code === branchCode) ?? branches[0];
  if (!branch) {
    return <p className="text-gray-500">ยังไม่มีสาขาในระบบ — ไปตั้งค่าที่หน้า &quot;ตั้งค่าสาขา/ค่าเช่า&quot;</p>;
  }

  const existing = await prisma.dailySales.findUnique({
    where: { branchId_date: { branchId: branch.id, date: parseDateOnly(date) } },
  });

  const recent = await prisma.dailySales.findMany({
    where: { branchId: branch.id },
    orderBy: { date: "desc" },
    take: 10,
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">กรอกยอดขายรายวัน — รายสาขา</h1>

      <EntryFilterBar
        branches={branches.map((b) => ({ code: b.code, name: b.name, type: b.type, isActive: b.isActive }))}
        branchCode={branchCode}
        date={date}
      />

      <DailySalesForm
        key={`${branch.id}-${date}`}
        branchId={branch.id}
        branchType={branch.type}
        date={date}
        existing={
          existing
            ? {
                cashPos: existing.cashPos,
                cashCounted: existing.cashCounted,
                transfer: existing.transfer,
                cashTransferCombined: existing.cashTransferCombined,
                grab: existing.grab,
                lineman: existing.lineman,
                posCheckTotal: existing.posCheckTotal,
                note: existing.note,
              }
            : null
        }
      />

      <h2 className="mb-3 mt-8 text-sm font-semibold text-gray-700">10 วันล่าสุดของสาขานี้</h2>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">วันที่</th>
              <th className="px-4 py-2">หน้าร้าน</th>
              <th className="px-4 py-2">Grab</th>
              <th className="px-4 py-2">Lineman</th>
              <th className="px-4 py-2">รวม</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => {
              const storefront =
                branch.type === "CASH" ? (r.cashPos ?? 0) + (r.transfer ?? 0) : r.cashTransferCombined ?? 0;
              const total = storefront + r.grab + r.lineman;
              return (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{formatThaiDate(r.date)}</td>
                  <td className="px-4 py-2">{formatBaht(storefront)}</td>
                  <td className="px-4 py-2">{formatBaht(r.grab)}</td>
                  <td className="px-4 py-2">{formatBaht(r.lineman)}</td>
                  <td className="px-4 py-2 font-medium">{formatBaht(total)}</td>
                </tr>
              );
            })}
            {recent.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-400" colSpan={5}>
                  ยังไม่มีข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
