import Link from "next/link";
import { prisma } from "@lamunn/db-finance";
import MonthFilterBar from "@/components/MonthFilterBar";
import EditableMonthlyChannelTable from "@/components/EditableMonthlyChannelTable";
import { monthRange } from "@/lib/dates";
import { formatBaht } from "@/lib/format";

const thaiMonthsShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const weekdaysShort = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

export default async function MonthlyOverviewPage({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  const now = new Date();
  const year = Number(searchParams.year) || now.getUTCFullYear();
  const month = Number(searchParams.month) || now.getUTCMonth() + 1;
  const { start, end } = monthRange(year, month - 1);
  const daysInMonth = end.getUTCDate();

  // ไม่กรอง isActive — สาขาที่ปิดไปแล้วต้องยังเห็นยอดขายย้อนหลังของเดือนที่เคยเปิดอยู่
  const branches = await prisma.branch.findMany({ orderBy: { sortOrder: "asc" } });
  const [salesRows, companyRows] = await Promise.all([
    prisma.dailySales.findMany({
      where: { date: { gte: start, lte: end } },
      include: { branch: { select: { type: true } } },
    }),
    prisma.companyChannelDaily.findMany({ where: { date: { gte: start, lte: end } } }),
  ]);

  // สรุปรายวัน (ทุกสาขารวมกัน) — สำหรับตารางแก้ไข E-Commerce
  const dayTotals = new Map<string, { storefrontTotal: number; grab: number; lineman: number }>();
  for (const r of salesRows) {
    const key = r.date.toISOString().slice(0, 10);
    const existing = dayTotals.get(key) ?? { storefrontTotal: 0, grab: 0, lineman: 0 };
    const storefront = r.branch.type === "CASH" ? (r.cashPos ?? 0) + (r.transfer ?? 0) : r.cashTransferCombined ?? 0;
    existing.storefrontTotal += storefront;
    existing.grab += r.grab;
    existing.lineman += r.lineman;
    dayTotals.set(key, existing);
  }
  const companyByDate = new Map(companyRows.map((c) => [c.date.toISOString().slice(0, 10), c]));

  const dayRows = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(Date.UTC(year, month - 1, day));
    const key = d.toISOString().slice(0, 10);
    const t = dayTotals.get(key) ?? { storefrontTotal: 0, grab: 0, lineman: 0 };
    const c = companyByDate.get(key);
    dayRows.push({
      date: key,
      dayLabel: `${day} ${thaiMonthsShort[month - 1]} (${weekdaysShort[d.getUTCDay()]})`,
      storefrontTotal: t.storefrontTotal,
      grab: t.grab,
      lineman: t.lineman,
      tiktok: c?.tiktok ?? 0,
      fbLine: c?.fbLine ?? 0,
      pickup: c?.pickup ?? 0,
      catering: c?.catering ?? 0,
    });
  }

  // Matrix รายสาขา x รายวัน (ยอดรวมต่อสาขาต่อวัน)
  const branchDayTotal = new Map<string, number>();
  for (const r of salesRows) {
    const storefront = r.branch.type === "CASH" ? (r.cashPos ?? 0) + (r.transfer ?? 0) : r.cashTransferCombined ?? 0;
    const total = storefront + r.grab + r.lineman;
    branchDayTotal.set(`${r.branchId}_${r.date.toISOString().slice(0, 10)}`, total);
  }

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-800">ยอดขายรายวัน — มุมมองรายเดือน</h1>
      <p className="mb-6 text-sm text-gray-500">
        ดูยอดขายทุกช่องทางแยกรายวันในเดือนเดียว แก้ไข TikTok / FB-Line / รับหน้าร้าน / Catering ได้ตรงนี้เลย (เหมาะสำหรับกรอกย้อนหลัง)
      </p>

      <MonthFilterBar basePath="/monthly" year={year} month={month} />

      <h2 className="mb-3 mt-6 text-sm font-semibold text-gray-700">สรุปรายวัน — แก้ไข E-Commerce ได้ตรงนี้</h2>
      <EditableMonthlyChannelTable rows={dayRows} />

      <h2 className="mb-3 mt-8 text-sm font-semibold text-gray-700">ยอดขายรายสาขา x รายวัน (คลิกเพื่อแก้ไข)</h2>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2">สาขา</th>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                <th key={day} className="px-2 py-2 text-right">
                  {day}
                </th>
              ))}
              <th className="px-3 py-2 text-right font-semibold">รวม</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => {
              let branchTotal = 0;
              return (
                <tr key={b.id} className="border-t border-gray-100">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-1.5 font-medium text-gray-800">
                    {b.name}
                    {!b.isActive && <span className="ml-1 text-[10px] font-normal text-gray-400">(ปิด)</span>}
                  </td>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const d = new Date(Date.UTC(year, month - 1, day));
                    const key = d.toISOString().slice(0, 10);
                    const val = branchDayTotal.get(`${b.id}_${key}`) ?? 0;
                    branchTotal += val;
                    return (
                      <td key={day} className="px-2 py-1.5 text-right text-gray-500">
                        {val ? (
                          <Link href={`/entry/daily?branch=${b.code}&date=${key}`} className="hover:text-brand-600 hover:underline">
                            {formatBaht(val)}
                          </Link>
                        ) : (
                          <Link href={`/entry/daily?branch=${b.code}&date=${key}`} className="text-gray-300 hover:text-brand-600">
                            -
                          </Link>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-1.5 text-right font-semibold text-gray-800">{formatBaht(branchTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
