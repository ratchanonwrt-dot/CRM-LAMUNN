import { Suspense } from "react";
import Link from "next/link";
import { prisma, computePeriodsForMonth, computeReceivable } from "@lamunn/db-finance";
import { requireSectionPage } from "@/lib/permissions";
import {
  collectOutstandingPeriods,
  deriveOutstandingByDueDate,
  derivePerBranchOutstanding,
  deriveOutstandingDetail,
  fetchCreditTermBranches,
  getUnresolvedShortfallsByBranch,
  pickUnresolvedShortfall,
} from "@/lib/creditTermCalc";
import { formatBaht, formatThaiDate } from "@/lib/format";
import GenerateCreditTermButton from "@/components/GenerateCreditTermButton";
import CreditTermStatusButton from "@/components/CreditTermStatusButton";
import CancelCreditTermButton from "@/components/CancelCreditTermButton";
import ExportPanel from "@/components/ExportPanel";
import AddManualCreditTermForm from "@/components/AddManualCreditTermForm";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function SectionSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="mb-8 animate-pulse rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 h-4 w-48 rounded bg-gray-200" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="mt-2 h-8 rounded bg-gray-100" />
      ))}
    </div>
  );
}

// ส่วน "ยอดค้างรับรวม" + ตาราง 2 ตัว — พึ่ง collectOutstandingPeriods() ซึ่งเป็นจุดที่หนักที่สุดของหน้านี้
// แยกออกมาเป็น Suspense ของตัวเอง ไม่ให้บล็อกส่วนอื่นที่คำนวณเร็วกว่า (รอบเดือนนี้/ประวัติ) ต้องรอไปด้วย
async function OutstandingSummarySection() {
  const now = new Date();
  const outstandingPeriods = await collectOutstandingPeriods();
  const dueDateGroups = deriveOutstandingByDueDate(outstandingPeriods);
  const perBranchOutstanding = derivePerBranchOutstanding(outstandingPeriods);
  const outstandingDetail = deriveOutstandingDetail(outstandingPeriods);
  const outstanding = perBranchOutstanding.reduce((sum, b) => sum + b.totalOutstanding, 0);
  const overdueTotal = dueDateGroups.filter((g) => g.dueDate < now).reduce((a, g) => a + g.totalAmount, 0);

  return (
    <>
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-medium text-amber-800">ยอดค้างรับรวมจากห้างทั้งหมดตอนนี้ (ทุกสาขา ทุกรอบ)</p>
        <p className="mt-1 text-3xl font-bold text-amber-700">{formatBaht(outstanding)} บาท</p>
        <p className="mt-1 text-xs text-amber-600">รวมทั้งรอบที่ยังไม่ได้กด &quot;ปิดรอบ&quot; ด้วย (คำนวณสดจากยอดขายจริง) ไม่ใช่แค่รอบที่ปิดแล้ว</p>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-gray-700">
        ยอดค้างห้างรายสาขา — เรียงตามวันครบกำหนดแต่ละรอบ (ไว้ไล่เช็คกับเงินเข้าบัญชีจริงทีละรอบ)
      </h2>
      <div className="mb-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[500px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">วันครบกำหนด</th>
              <th className="px-3 py-2">ห้าง / สาขา</th>
              <th className="px-3 py-2 text-right">ยอดค้างรอบนี้ (บาท)</th>
              <th className="px-3 py-2">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {outstandingDetail.map((o, i) => (
              <tr key={`${o.branchId}-${o.dueDate.toISOString()}-${i}`} className={`border-t border-gray-100 ${o.dueDate < now ? "bg-red-50" : ""}`}>
                <td className="px-3 py-2 text-gray-600">
                  {formatThaiDate(o.dueDate)} {o.dueDate < now && <span className="text-red-600">(เกินกำหนด)</span>}
                </td>
                <td className="px-3 py-2 font-medium text-gray-800">{o.branchName}</td>
                <td className="px-3 py-2 text-right font-semibold text-brand-700">{formatBaht(o.netAmount)}</td>
                <td className="px-3 py-2">
                  {o.existingId && o.status ? (
                    <CreditTermStatusButton
                      id={o.existingId}
                      status={o.status}
                      netAmount={o.netAmount}
                      receivedAmount={o.receivedAmount}
                      shortfallAmount={o.shortfallAmount}
                    />
                  ) : (
                    <GenerateCreditTermButton
                      branchId={o.branchId}
                      periodStart={toISODate(o.periodStart)}
                      periodEnd={toISODate(o.periodEnd)}
                      dueDate={toISODate(o.dueDate)}
                    />
                  )}
                </td>
              </tr>
            ))}
            {outstandingDetail.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-400" colSpan={4}>
                  ไม่มียอดค้างกับห้างใดเลยตอนนี้
                </td>
              </tr>
            )}
          </tbody>
          {outstandingDetail.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                <td className="px-3 py-2" colSpan={2}>
                  รวมทั้งหมด ({outstandingDetail.length} รอบ)
                </td>
                <td className="px-3 py-2 text-right">{formatBaht(outstandingDetail.reduce((a, o) => a + o.netAmount, 0))}</td>
                <td className="px-3 py-2"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">เกินกำหนดแล้ว</p>
          <p className="mt-1 text-lg font-bold text-red-600">{formatBaht(overdueTotal)} บาท</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">จำนวนรอบที่รอรับ</p>
          <p className="mt-1 text-lg font-bold text-gray-800">{dueDateGroups.reduce((a, g) => a + g.count, 0)}</p>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-gray-700">
        เงินจะเข้าวันไหนบ้าง (ที่ยังค้างอยู่ทั้งหมด รวมรอบที่ยังไม่ได้ปิดรอบด้วย)
      </h2>
      <div className="mb-8 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[500px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">วันครบกำหนด</th>
              <th className="px-3 py-2 text-right">ยอดรวมที่จะได้รับ</th>
              <th className="px-3 py-2 text-right">จำนวนรอบ</th>
            </tr>
          </thead>
          <tbody>
            {dueDateGroups.map((g) => (
              <tr key={g.dueDate.toISOString()} className={`border-t border-gray-100 ${g.dueDate < now ? "bg-red-50" : ""}`}>
                <td className="px-3 py-2 font-medium text-gray-800">
                  {formatThaiDate(g.dueDate)} {g.dueDate < now && <span className="text-red-600">(เกินกำหนด)</span>}
                </td>
                <td className="px-3 py-2 text-right font-semibold text-brand-700">{formatBaht(g.totalAmount)}</td>
                <td className="px-3 py-2 text-right text-gray-500">{g.count}</td>
              </tr>
            ))}
            {dueDateGroups.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-400" colSpan={3}>
                  ไม่มีรายการรอชำระ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ส่วน "รอบเดือนนี้ — คำนวณสด" — ไม่ได้ขึ้นกับ collectOutstandingPeriods เลย แยก query ของตัวเอง
// (เร็วกว่าส่วนบนมาก) ให้ขึ้นได้ก่อนโดยไม่ต้องรอส่วนที่หนักกว่า
async function MonthCardsSection() {
  const branches = await fetchCreditTermBranches();
  const activeBranches = branches.filter((b) => b.creditTermConfig);

  const now = new Date();
  const year = now.getUTCFullYear();
  const monthIndex0 = now.getUTCMonth();

  const cardTargets = activeBranches.flatMap((b) => {
    const periods = computePeriodsForMonth(b.creditTermConfig!, year, monthIndex0);
    return periods.map((p) => ({ branch: b, period: p }));
  });
  const branchIds = activeBranches.map((b) => b.id);
  const monthStart = new Date(Date.UTC(year, monthIndex0, 1));

  const [existingForCards, dailyForCards, unresolvedShortfallsByBranch] = await Promise.all([
    prisma.creditTermPayment.findMany({
      where: { branchId: { in: branchIds }, periodStart: { gte: monthStart } },
      select: { id: true, branchId: true, periodStart: true, periodEnd: true, status: true, netAmount: true, receivedAmount: true, shortfallAmount: true, carriedInAmount: true },
    }),
    prisma.dailySales.findMany({
      where: { branchId: { in: branchIds }, date: { gte: monthStart, lte: now } },
      select: { branchId: true, date: true, cashTransferCombined: true, grab: true, lineman: true },
    }),
    getUnresolvedShortfallsByBranch(branchIds),
  ]);
  const existingCardMap = new Map(
    existingForCards.map((p) => [`${p.branchId}_${p.periodStart!.toISOString()}_${p.periodEnd!.toISOString()}`, p])
  );
  const dailyByBranchForCards = new Map<string, { date: Date; storefront: number; delivery: number }[]>();
  for (const r of dailyForCards) {
    const list = dailyByBranchForCards.get(r.branchId) ?? [];
    list.push({ date: r.date, storefront: r.cashTransferCombined ?? 0, delivery: (r.grab ?? 0) + (r.lineman ?? 0) });
    dailyByBranchForCards.set(r.branchId, list);
  }

  const currentPeriodCards = cardTargets.map(({ branch, period }) => {
    const existing = existingCardMap.get(`${branch.id}_${period.periodStart.toISOString()}_${period.periodEnd.toISOString()}`);

    let grossStorefront = 0;
    let grossDelivery = 0;
    for (const r of dailyByBranchForCards.get(branch.id) ?? []) {
      if (r.date >= period.periodStart && r.date <= period.periodEnd) {
        grossStorefront += r.storefront;
        grossDelivery += r.delivery;
      }
    }
    const result = computeReceivable({
      grossStorefront,
      grossDelivery,
      gpPercentStorefront: branch.rentConfig?.gpPercentStorefront ?? 0,
      gpPercentDelivery: branch.rentConfig?.gpPercentDelivery ?? 0,
      vendorFeeMonthly: grossStorefront === 0 && grossDelivery === 0 ? 0 : branch.rentConfig?.vendorFeeMonthly ?? 0,
      deductDeliveryGp: branch.creditTermConfig?.deductDeliveryGp ?? true,
    });
    const carried = existing ? null : pickUnresolvedShortfall(unresolvedShortfallsByBranch, branch.id, period.periodStart);
    const carriedInAmount = existing?.carriedInAmount ?? carried?.amount ?? 0;
    const computed = {
      grossStorefront,
      grossDelivery,
      ...result,
      rawNetAmount: result.netAmount,
      netAmount: result.netAmount + carriedInAmount,
      carriedInAmount,
    };
    return { branch, period, computed, existing };
  });

  const PERIOD_LABEL_ORDER: Record<string, number> = { "งวด 1-15": 0, "งวด 1-สิ้นเดือน": 2 };
  const periodGroupOrder = (label: string) => PERIOD_LABEL_ORDER[label] ?? 1;
  const periodGroupMap = new Map<string, { label: string; periodStart: Date; periodEnd: Date; cards: typeof currentPeriodCards }>();
  for (const card of currentPeriodCards) {
    const key = card.period.label;
    const group = periodGroupMap.get(key);
    if (group) {
      group.cards.push(card);
    } else {
      periodGroupMap.set(key, { label: key, periodStart: card.period.periodStart, periodEnd: card.period.periodEnd, cards: [card] });
    }
  }
  const periodGroups = [...periodGroupMap.values()].sort((a, b) => periodGroupOrder(a.label) - periodGroupOrder(b.label));

  return (
    <>
      <h2 className="mb-3 text-sm font-semibold text-gray-700">รอบเดือนนี้ — คำนวณสด (กดปิดรอบเมื่อพร้อม)</h2>
      <div className="mb-8 flex flex-col gap-6">
        {periodGroups.map((group) => (
          <div key={group.label}>
            <h3 className="mb-2 flex items-baseline gap-2 text-sm font-semibold text-gray-600">
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-gray-700">รอบ {group.label}</span>
              <span className="text-xs font-normal text-gray-400">
                ({formatThaiDate(group.periodStart)} – {formatThaiDate(group.periodEnd)}) — {group.cards.length} สาขา
              </span>
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.cards.map(({ branch, period, computed, existing }, i) => (
                <div key={`${branch.id}-${i}`} className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-semibold text-gray-800">{branch.name}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    ยอดขาย {formatBaht(computed.grossStorefront + computed.grossDelivery)} บาท → หัก GP{" "}
                    {formatBaht(computed.gpDeductStorefront + computed.gpDeductDelivery + computed.vendorFeeDeduct)} บาท
                  </p>
                  {(existing?.carriedInAmount ?? computed.carriedInAmount) > 0 && (
                    <p className="mt-1 text-xs font-medium text-amber-600">
                      + ยอดค้างทบจากงวดก่อน {formatBaht(existing?.carriedInAmount ?? computed.carriedInAmount)} บาท
                    </p>
                  )}
                  <p className="mt-1 text-base font-bold text-brand-700">
                    {formatBaht(existing ? existing.netAmount : computed.netAmount)} บาท
                  </p>
                  <p className="text-xs text-gray-400">ครบกำหนด {formatThaiDate(period.dueDate)}</p>
                  <div className="mt-3 flex items-center gap-2">
                    {existing ? (
                      <CreditTermStatusButton
                        id={existing.id}
                        status={existing.status}
                        netAmount={existing.netAmount}
                        receivedAmount={existing.receivedAmount}
                        shortfallAmount={existing.shortfallAmount}
                      />
                    ) : (
                      <span className="text-xs text-gray-400">ยังไม่ปิดรอบ</span>
                    )}
                    <GenerateCreditTermButton
                      branchId={branch.id}
                      periodStart={toISODate(period.periodStart)}
                      periodEnd={toISODate(period.periodEnd)}
                      dueDate={toISODate(period.dueDate)}
                    />
                    {existing && existing.status === "PENDING" && <CancelCreditTermButton id={existing.id} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ส่วน "ประวัติรอบรับเงินทั้งหมด" — query ของตัวเอง (ไม่ขึ้นกับ 2 ส่วนบน) เร็วเพราะ take:100 + select เฉพาะที่ใช้
async function HistorySection() {
  const [allPayments, branches] = await Promise.all([
    prisma.creditTermPayment.findMany({ include: { branch: true }, orderBy: { dueDate: "desc" }, take: 100 }),
    prisma.branch.findMany({ where: { type: "CREDIT_TERM" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <h2 className="mb-3 text-sm font-semibold text-gray-700">ประวัติรอบรับเงินทั้งหมด</h2>
      <AddManualCreditTermForm branches={branches} />
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">สาขา / รายการ</th>
              <th className="px-3 py-2">ช่วงเวลา</th>
              <th className="px-3 py-2 text-right">ยอดที่ต้องรับ</th>
              <th className="px-3 py-2 text-right">ได้รับจริง</th>
              <th className="px-3 py-2 text-right">ค้าง/ทบยอด</th>
              <th className="px-3 py-2">ครบกำหนด</th>
              <th className="px-3 py-2">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {allPayments.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-gray-800">{p.branch?.name ?? p.label ?? "-"}</td>
                <td className="px-3 py-2 text-gray-500">
                  {p.periodStart && p.periodEnd
                    ? `${formatThaiDate(p.periodStart)} – ${formatThaiDate(p.periodEnd)}`
                    : p.label ?? "-"}
                </td>
                <td className="px-3 py-2 text-right font-medium">
                  {formatBaht(p.netAmount)}
                  {p.carriedInAmount > 0 && (
                    <p className="text-[10px] font-normal text-amber-500">(รวมทบมา {formatBaht(p.carriedInAmount)})</p>
                  )}
                </td>
                <td className="px-3 py-2 text-right text-gray-600">
                  {p.status === "PAID" ? formatBaht(p.receivedAmount ?? p.netAmount) : "-"}
                </td>
                <td className="px-3 py-2 text-right">
                  {p.shortfallAmount > 0 ? (
                    <span className="font-medium text-amber-600">{formatBaht(p.shortfallAmount)}</span>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="px-3 py-2 text-gray-500">{formatThaiDate(p.dueDate)}</td>
                <td className="px-3 py-2">
                  <CreditTermStatusButton
                    id={p.id}
                    status={p.status}
                    netAmount={p.netAmount}
                    receivedAmount={p.receivedAmount}
                    shortfallAmount={p.shortfallAmount}
                  />
                </td>
              </tr>
            ))}
            {allPayments.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-400" colSpan={7}>
                  ยังไม่มีรายการ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default async function CreditTermPage() {
  await requireSectionPage("CREDIT_TERM");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-gray-800">Credit Term — ตารางจ่ายเงินและยอดค้างรับจากห้าง</h1>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/credit-term/billing" className="text-sm text-brand-600 hover:underline">
            🧾 วางบิล The Mall Group →
          </Link>
          <Link href="/credit-term/settings" className="text-sm text-brand-600 hover:underline">
            ⚙ ตั้งค่ารอบจ่ายเงินรายสาขา →
          </Link>
          <ExportPanel
            apiPath="/api/export/credit-term"
            options={[
              { key: "outstanding", label: "ยอดค้างห้างรายสาขา (ตามวันครบกำหนด)" },
              { key: "history", label: "ประวัติรอบรับเงินทั้งหมด" },
            ]}
          />
        </div>
      </div>

      <details className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5 open:pb-5">
        <summary className="cursor-pointer text-sm font-semibold text-blue-800">📖 วิธีใช้งานหน้านี้ (สำหรับบัญชี) — คลิกเพื่อดู</summary>
        <div className="mt-4 space-y-4 text-sm text-blue-900">
          <div>
            <p className="font-semibold">1. ยอดค้างรับรวมจากห้างทั้งหมดตอนนี้ (กล่องเหลืองด้านล่าง)</p>
            <p className="text-blue-800">
              ยอดรวมทุกรอบทุกสาขาที่ห้างยังไม่โอนเงินมาให้ — รวมทั้งรอบที่ &quot;ปิดรอบ&quot; แล้ว (ตัวเลขนิ่ง) และรอบปัจจุบันที่ยังไม่ปิด (คำนวณสดจากยอดขายวันต่อวัน จะขยับทุกวันที่มีการกรอกยอดขายเพิ่ม)
            </p>
          </div>
          <div>
            <p className="font-semibold">2. ตาราง &quot;ยอดค้างห้างรายสาขา — เรียงตามวันครบกำหนด&quot;</p>
            <p className="text-blue-800">
              ใช้ไล่เช็คกับเงินที่โอนเข้าบัญชีจริงทีละรอบ เรียงจากวันครบกำหนดใกล้สุดก่อน แถวสีแดง = เกินกำหนดแล้วแต่ยังไม่ได้รับเงิน กดปุ่ม &quot;ปิดรอบ / อัปเดตยอด&quot; เพื่อบันทึกว่ารอบนี้ปิดแล้ว หรือกดเพื่ออัปเดตสถานะ/จำนวนเงินที่ได้รับจริง
            </p>
          </div>
          <div>
            <p className="font-semibold">3. &quot;เงินจะเข้าวันไหนบ้าง&quot;</p>
            <p className="text-blue-800">สรุปยอดที่จะได้รับ รวมเป็นก้อนตามวันครบกำหนด ใช้วางแผนกระแสเงินสดล่วงหน้า</p>
          </div>
          <div>
            <p className="font-semibold">4. &quot;รอบเดือนนี้ — คำนวณสด&quot;</p>
            <p className="text-blue-800">
              แยกเป็นกลุ่มตามรอบบิล (1-15 / 16-{"{สิ้นเดือน}"} / เต็มเดือน แล้วแต่ตั้งค่าของแต่ละสาขา) แต่ละการ์ดคำนวณยอดขายและยอดที่จะได้รับสดๆ จากข้อมูลยอดขายที่กรอกไว้ในรอบนั้น — <b>ตัวเลขยังไม่นิ่ง จะขยับทุกครั้งที่มีการกรอกยอดขายเพิ่ม</b> เมื่อพร้อมปิดรอบ (เช่น ครบ 15 หรือครบเดือนแล้ว) ให้กดปุ่ม &quot;ปิดรอบ / อัปเดตยอด&quot; ในการ์ดนั้น เพื่อล็อกยอดไว้เป็นรายการถาวรและเริ่มติดตามสถานะการจ่ายเงิน (ยังไม่จ่าย → ตั้งโอนแล้ว → จ่ายแล้วรอบิล → ได้รับใบเสร็จแล้ว)
            </p>
          </div>
          <div>
            <p className="font-semibold">5. &quot;ประวัติรอบรับเงินทั้งหมด&quot;</p>
            <p className="text-blue-800">
              รายการรอบที่ปิดแล้วทั้งหมด (เรียงใหม่สุดก่อน) กดที่สถานะเพื่อเปลี่ยน/ย้อนกลับได้ ถ้ามียอดค้างจากรอบก่อนที่ต้องทบไปรอบถัดไป จะขึ้นเป็นตัวเลขสีส้มในช่อง &quot;ค้าง/ทบยอด&quot; และจะถูกบวกเข้ารอบถัดไปให้อัตโนมัติ ปุ่ม &quot;+ เพิ่มรายการยอดยกมา / manual&quot; ใช้สำหรับกรอกรายการที่ไม่ได้มาจากระบบ (เช่น ยอดยกมาจากช่วงก่อนเริ่มใช้ระบบ)
            </p>
          </div>
        </div>
      </details>

      <Suspense fallback={<SectionSkeleton lines={4} />}>
        <OutstandingSummarySection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton lines={3} />}>
        <MonthCardsSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton lines={3} />}>
        <HistorySection />
      </Suspense>
    </div>
  );
}
