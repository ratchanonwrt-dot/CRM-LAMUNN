import { prisma } from "@lamunn/db-finance";
import MonthFilterBar from "@/components/MonthFilterBar";
import { monthRange } from "@/lib/dates";
import { formatBaht, formatThaiDate } from "@/lib/format";
import { getAllSettings, calcGrabNet, calcLinemanNet } from "@/lib/settings";

export default async function DepositsPage({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  const now = new Date();
  const year = Number(searchParams.year) || now.getUTCFullYear();
  const month = Number(searchParams.month) || now.getUTCMonth() + 1;
  const { start, end } = monthRange(year, month - 1);

  const settings = await getAllSettings();
  const grabFeePercent = Number(settings.grabFeePercent);
  const grabFeeVatPercent = Number(settings.grabFeeVatPercent);
  const linemanFeePercent = Number(settings.linemanFeePercent);

  const [salesRows, companyRows] = await Promise.all([
    prisma.dailySales.findMany({
      where: { date: { gte: start, lte: end } },
      include: { branch: { select: { type: true } } },
    }),
    prisma.companyChannelDaily.findMany({ where: { date: { gte: start, lte: end } } }),
  ]);

  const byDate = new Map<
    string,
    { transferExpected: number; grabGross: number; linemanGross: number }
  >();
  for (const r of salesRows) {
    const key = r.date.toISOString().slice(0, 10);
    const existing = byDate.get(key) ?? { transferExpected: 0, grabGross: 0, linemanGross: 0 };
    if (r.branch.type === "CASH") existing.transferExpected += r.transfer ?? 0;
    existing.grabGross += r.grab;
    existing.linemanGross += r.lineman;
    byDate.set(key, existing);
  }
  const actualByDate = new Map(companyRows.map((c) => [c.date.toISOString().slice(0, 10), c]));

  const rows: {
    date: Date;
    transferExpected: number;
    grabGross: number;
    grabNetExpected: number;
    linemanGross: number;
    linemanNetExpected: number;
    totalExpected: number;
    depositStorefront: number | null;
    depositGrab: number | null;
    depositLineman: number | null;
  }[] = [];

  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const s = byDate.get(key);
    if (!s) continue;
    const grabNetExpected = calcGrabNet(s.grabGross, grabFeePercent, grabFeeVatPercent);
    const linemanNetExpected = calcLinemanNet(s.linemanGross, linemanFeePercent);
    const actual = actualByDate.get(key);
    rows.push({
      date: new Date(d),
      transferExpected: s.transferExpected,
      grabGross: s.grabGross,
      grabNetExpected,
      linemanGross: s.linemanGross,
      linemanNetExpected,
      totalExpected: s.transferExpected + grabNetExpected + linemanNetExpected,
      depositStorefront: actual?.depositStorefront ?? null,
      depositGrab: actual?.depositGrab ?? null,
      depositLineman: actual?.depositLineman ?? null,
    });
  }

  const totals = rows.reduce(
    (a, r) => ({
      transferExpected: a.transferExpected + r.transferExpected,
      grabNetExpected: a.grabNetExpected + r.grabNetExpected,
      linemanNetExpected: a.linemanNetExpected + r.linemanNetExpected,
      totalExpected: a.totalExpected + r.totalExpected,
    }),
    { transferExpected: 0, grabNetExpected: 0, linemanNetExpected: 0, totalExpected: 0 }
  );

  function diffCell(actual: number | null, expected: number) {
    if (actual === null) return <span className="text-gray-300">-</span>;
    const diff = actual - expected;
    if (Math.abs(diff) < 0.01) return <span className="text-emerald-600">ตรง</span>;
    return <span className="font-medium text-red-600">{formatBaht(diff)}</span>;
  }

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-800">สถานะเงินเข้าบัญชี</h1>
      <p className="mb-6 text-sm text-gray-500">
        ยอดที่ควรเข้าบัญชี (เงินโอนหน้าร้าน + Grab หัก GP {formatBaht(grabFeePercent * 100)}%+VAT{" "}
        {formatBaht(grabFeeVatPercent * 100)}% + Lineman หัก {formatBaht(linemanFeePercent * 100)}% รวม VAT) เทียบกับยอดที่กรอกจริง
        เพื่อให้บัญชีตรวจกับ statement — แก้ไขเปอร์เซ็นต์หักได้ที่หน้าตั้งค่าระบบ
      </p>

      <MonthFilterBar basePath="/deposits" year={year} month={month} />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">เงินโอนหน้าร้าน (ควรเข้า)</p>
          <p className="mt-1 text-lg font-bold text-gray-800">{formatBaht(totals.transferExpected)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Grab + Lineman สุทธิ (ควรเข้า)</p>
          <p className="mt-1 text-lg font-bold text-gray-800">{formatBaht(totals.grabNetExpected + totals.linemanNetExpected)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">รวมที่ควรเข้าบัญชีทั้งหมด</p>
          <p className="mt-1 text-lg font-bold text-brand-700">{formatBaht(totals.totalExpected)}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">วันที่</th>
              <th className="px-3 py-2 text-right">โอนหน้าร้าน (ควรเข้า)</th>
              <th className="px-3 py-2 text-right">Grab สุทธิ (ควรเข้า)</th>
              <th className="px-3 py-2 text-right">Lineman สุทธิ (ควรเข้า)</th>
              <th className="px-3 py-2 text-right">โอนหน้าร้าน (จริง)</th>
              <th className="px-3 py-2 text-right">Grab (จริง)</th>
              <th className="px-3 py-2 text-right">Lineman (จริง)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.date.toISOString()} className="border-t border-gray-100">
                <td className="px-3 py-2">{formatThaiDate(r.date)}</td>
                <td className="px-3 py-2 text-right text-gray-500">{formatBaht(r.transferExpected)}</td>
                <td className="px-3 py-2 text-right text-gray-500">{formatBaht(r.grabNetExpected)}</td>
                <td className="px-3 py-2 text-right text-gray-500">{formatBaht(r.linemanNetExpected)}</td>
                <td className="px-3 py-2 text-right">{diffCell(r.depositStorefront, r.transferExpected)}</td>
                <td className="px-3 py-2 text-right">{diffCell(r.depositGrab, r.grabNetExpected)}</td>
                <td className="px-3 py-2 text-right">{diffCell(r.depositLineman, r.linemanNetExpected)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-400" colSpan={7}>
                  ยังไม่มีข้อมูลในเดือนนี้
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-400">
        คอลัมน์ &quot;จริง&quot; มาจากช่อง &quot;ยอดเข้าบัญชี&quot; ที่กรอกในหน้า &quot;กรอกยอด E-Commerce กลาง&quot; — ถ้าไม่ได้กรอกจะขึ้น &quot;-&quot;
      </p>
    </div>
  );
}
