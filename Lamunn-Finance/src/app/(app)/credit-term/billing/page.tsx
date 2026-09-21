import Link from "next/link";
import { prisma, computePeriodsForMonth } from "@lamunn/db-finance";
import { requireSectionPage } from "@/lib/permissions";
import MonthFilterBar from "@/components/MonthFilterBar";
import BranchBillingRow from "@/components/BranchBillingRow";
import { formatBaht, formatThaiDate } from "@/lib/format";
import { computeMallGroupBilling } from "@/lib/billingCalc";
import ExportPanel from "@/components/ExportPanel";
import { ChevronDown } from "lucide-react";

// ลำดับคงที่ของงวดที่แสดงบนหน้านี้ — ไม่ว่าเดือนไหนก็เรียงเหมือนกันเสมอ (งวดครึ่งเดือนก่อน แล้วค่อยงวดเต็มเดือน)
const PERIOD_LABELS = ["งวด 1-15", "งวด 16-สิ้นเดือน", "งวด 1-สิ้นเดือน"];

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function BillingPage({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  await requireSectionPage("CREDIT_TERM");
  const now = new Date();
  const dayOfMonth = now.getUTCDate();

  // Flow งานจริงของบัญชี: เข้ามาหน้านี้แค่ 2 วันต่อเดือน (วันที่ 1 กับ 16) เพื่อวางบิลรอบที่เพิ่งปิดไป
  // วันที่ 1-5 = รอบท้ายเดือนก่อน (16-สิ้นเดือน + เต็มเดือน) เพิ่งปิด ต้องรีบวางบิล — ข้อมูลอยู่ในหน้าเดือนก่อน ไม่ใช่เดือนนี้
  // วันที่ 14-20 = รอบต้นเดือนนี้ (1-15) เพิ่งปิด ต้องรีบวางบิล
  // เพื่อไม่ให้บัญชีต้องกดเปลี่ยนเดือนเอง หน้านี้จะ auto พาไปเดือนที่ถูกต้อง + กางงวดที่ต้องรีบทำไว้ให้เลย
  let dueYear = now.getUTCFullYear();
  let dueMonth = now.getUTCMonth() + 1;
  let dueLabels: string[] = [];
  if (dayOfMonth <= 5) {
    const prevMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    dueYear = prevMonthDate.getUTCFullYear();
    dueMonth = prevMonthDate.getUTCMonth() + 1;
    dueLabels = ["งวด 16-สิ้นเดือน", "งวด 1-สิ้นเดือน"];
  } else if (dayOfMonth >= 14 && dayOfMonth <= 20) {
    dueLabels = ["งวด 1-15"];
  }

  const year = Number(searchParams.year) || (dueLabels.length > 0 ? dueYear : now.getUTCFullYear());
  const month = Number(searchParams.month) || (dueLabels.length > 0 ? dueMonth : now.getUTCMonth() + 1);
  const monthIndex0 = month - 1;
  const isDueMonthView = dueLabels.length > 0 && year === dueYear && month === dueMonth;

  const [groups, branches] = await Promise.all([
    prisma.billingGroup.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.branch.findMany({
      where: { type: "CREDIT_TERM" },
      orderBy: { sortOrder: "asc" },
      include: { rentConfig: true, creditTermConfig: { include: { billingGroup: true } } },
    }),
  ]);

  const assignedBranches = branches.filter((b) => b.creditTermConfig?.billingGroupId);

  const periodTargets = assignedBranches.flatMap((b) => {
    const periods = computePeriodsForMonth(b.creditTermConfig!, year, monthIndex0);
    return periods.map((p) => ({ branch: b, period: p }));
  });

  const existingBillings = await prisma.branchBilling.findMany({
    where: { branchId: { in: assignedBranches.map((b) => b.id) } },
  });
  const existingMap = new Map(
    existingBillings.map((e) => [`${e.branchId}_${e.periodStart.toISOString()}_${e.periodEnd.toISOString()}`, e])
  );

  const rows = periodTargets.map(({ branch, period }) => {
    const existing = existingMap.get(`${branch.id}_${period.periodStart.toISOString()}_${period.periodEnd.toISOString()}`);
    const dueDays = branch.creditTermConfig?.billingDueDays;
    const dueDateIso = dueDays != null ? toISODate(new Date(period.periodEnd.getTime() + dueDays * 86400000)) : null;
    return {
      branch,
      period,
      storefrontSalesIncVat: existing?.storefrontSalesIncVat ?? 0,
      deliverySalesIncVat: existing?.deliverySalesIncVat ?? 0,
      billingDate: existing?.billingDate ? toISODate(existing.billingDate) : null,
      dueDateIso,
    };
  });

  const todayIso = toISODate(now);
  const overdueRows = rows.filter((r) => !r.billingDate && r.dueDateIso && r.dueDateIso < todayIso);
  const dueSoonRows = rows.filter(
    (r) => !r.billingDate && r.dueDateIso && r.dueDateIso >= todayIso && r.dueDateIso <= toISODate(new Date(now.getTime() + 3 * 86400000))
  );

  function totalsFor(groupRows: typeof rows) {
    return groupRows.reduce(
      (acc, r) => {
        const result = computeMallGroupBilling(
          r.storefrontSalesIncVat,
          r.deliverySalesIncVat,
          r.branch.rentConfig?.gpPercentStorefront ?? 0,
          r.branch.rentConfig?.gpPercentDelivery ?? 0,
          r.branch.creditTermConfig?.billingGroup?.usesWithholdingCert ?? true
        );
        acc.salesIncVat += result.storefront.salesIncVat + result.delivery.salesIncVat;
        acc.gpNoVat += result.storefront.gpNoVat + result.delivery.gpNoVat;
        acc.gpVat += result.storefront.gpVat + result.delivery.gpVat;
        acc.wht += result.storefront.wht + result.delivery.wht;
        acc.finalNetTransfer += result.finalNetTransfer;
        return acc;
      },
      { salesIncVat: 0, gpNoVat: 0, gpVat: 0, wht: 0, finalNetTransfer: 0 }
    );
  }

  const grandTotal = totalsFor(rows);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-gray-800">วางบิล</h1>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/credit-term/billing/settings" className="text-sm text-brand-600 hover:underline">
            ⚙ ตั้งค่าประเภท/สาขา →
          </Link>
          <Link href="/credit-term" className="text-sm text-brand-600 hover:underline">
            ← กลับไปหน้า Credit Term
          </Link>
          <ExportPanel
            apiPath="/api/export/billing"
            extraParams={{ year: String(year), month: String(month) }}
            options={groups.map((g) => ({ key: g.id, label: g.name }))}
          />
        </div>
      </div>
      <p className="mb-6 text-sm text-gray-500">
        สาขาที่กำหนดประเภทวางบิลไว้ (The Mall Group / Central / Tops ฯลฯ) ไม่ดึงยอดขายจาก POS อัตโนมัติ — กรอกยอดขายรวม VAT
        เองแยกหน้าร้าน/Delivery ต่องวด ระบบคำนวณ VAT, GP, หัก ณ ที่จ่าย 3% และยอดสุดท้ายที่ห้างต้องโอนคืนให้อัตโนมัติ
      </p>

      <MonthFilterBar basePath="/credit-term/billing" year={year} month={month} />

      {(overdueRows.length > 0 || dueSoonRows.length > 0) && (
        <div className="mb-6 mt-6 flex flex-wrap gap-3">
          {overdueRows.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-semibold text-red-700">⚠ เลยกำหนดวางบิลแล้ว {overdueRows.length} รายการ</p>
              <p className="mt-0.5 text-xs text-red-500">
                {overdueRows.map((r) => `${r.branch.name} (${r.period.label})`).join(", ")}
              </p>
            </div>
          )}
          {dueSoonRows.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-700">ใกล้ครบกำหนดวางบิล {dueSoonRows.length} รายการ (ภายใน 3 วัน)</p>
              <p className="mt-0.5 text-xs text-amber-600">
                {dueSoonRows.map((r) => `${r.branch.name} (${r.period.label})`).join(", ")}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mb-8 mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">ยอดขายรวม VAT ทั้งหมด</p>
          <p className="mt-1 text-base font-bold text-gray-800">{formatBaht(grandTotal.salesIncVat)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">GP ไม่รวม VAT</p>
          <p className="mt-1 text-base font-bold text-gray-800">{formatBaht(grandTotal.gpNoVat)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">VAT ของ GP</p>
          <p className="mt-1 text-base font-bold text-gray-800">{formatBaht(grandTotal.gpVat)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">รวมหัก ณ ที่จ่ายของ GP</p>
          <p className="mt-1 text-base font-bold text-gray-800">{formatBaht(grandTotal.wht)}</p>
        </div>
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
          <p className="text-xs text-brand-600">ยอดสุดท้ายที่ห้างต้องโอนคืนรวมทั้งหมด</p>
          <p className="mt-1 text-base font-bold text-brand-700">{formatBaht(grandTotal.finalNetTransfer)}</p>
        </div>
      </div>

      {PERIOD_LABELS.map((label) => {
        const labelRows = rows.filter((r) => r.period.label === label);
        if (labelRows.length === 0) return null;
        const labelTotals = totalsFor(labelRows);
        const { period } = labelRows[0];
        const labelBranchCount = new Set(labelRows.map((r) => r.branch.id)).size;
        const isDueNow = isDueMonthView && dueLabels.includes(label);

        return (
          <details key={label} open={isDueNow} className={`group mb-8 rounded-xl border bg-white ${isDueNow ? "border-brand-300 ring-1 ring-brand-100" : "border-gray-200"}`}>
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-gray-700 [&::-webkit-details-marker]:hidden">
              <span>
                {isDueNow && (
                  <span className="mr-2 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                    🔔 ถึงกำหนดวางบิลรอบนี้
                  </span>
                )}
                {label}{" "}
                <span className="font-normal text-gray-400">
                  ({formatThaiDate(period.periodStart)} – {formatThaiDate(period.periodEnd)}, {labelBranchCount} สาขา)
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-xs font-semibold text-brand-700">โอนคืนรวมงวดนี้ {formatBaht(labelTotals.finalNetTransfer)} บาท</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
              </span>
            </summary>

            <div className="border-t border-gray-100 p-4">
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[11px] text-gray-500">ยอดขายรวม VAT</p>
                  <p className="text-sm font-semibold text-gray-800">{formatBaht(labelTotals.salesIncVat)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[11px] text-gray-500">GP ไม่รวม VAT</p>
                  <p className="text-sm font-semibold text-gray-800">{formatBaht(labelTotals.gpNoVat)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[11px] text-gray-500">VAT ของ GP</p>
                  <p className="text-sm font-semibold text-gray-800">{formatBaht(labelTotals.gpVat)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[11px] text-gray-500">หัก ณ ที่จ่ายรวม</p>
                  <p className="text-sm font-semibold text-gray-800">{formatBaht(labelTotals.wht)}</p>
                </div>
                <div className="rounded-lg bg-brand-50 p-3">
                  <p className="text-[11px] text-brand-600">โอนคืนรวมงวดนี้</p>
                  <p className="text-sm font-semibold text-brand-700">{formatBaht(labelTotals.finalNetTransfer)}</p>
                </div>
              </div>

              {groups.map((group) => {
                const groupRows = labelRows.filter((r) => r.branch.creditTermConfig?.billingGroupId === group.id);
                if (groupRows.length === 0) return null;
                const groupTotals = totalsFor(groupRows);
                const docs = [
                  group.usesSummarySheet && "ใบสรุปยอด",
                  group.usesPaymentReceipt && "ใบรับเงิน",
                  group.usesTaxInvoice && "ใบเสร็จ/ใบกำกับภาษี",
                  group.usesWithholdingCert && "ใบหัก ณ ที่จ่าย",
                ].filter(Boolean);
                const dueDates = Array.from(new Set(groupRows.map((r) => r.dueDateIso).filter(Boolean))).sort();

                return (
                  <div key={group.id} className="mb-6 rounded-xl border border-gray-100 bg-gray-50/50 p-3 last:mb-0">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
                      <p className="text-sm font-semibold text-gray-700">
                        {group.name} <span className="font-normal text-gray-400">({groupRows.length} สาขา)</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="text-gray-400">เอกสาร: {docs.length > 0 ? docs.join(", ") : "ยังไม่ได้ตั้งค่า"}</span>
                        {dueDates.length > 0 && (
                          <span className="text-gray-400">
                            ครบกำหนดวางบิล: {dueDates.map((d) => formatThaiDate(new Date(d!))).join(", ")}
                          </span>
                        )}
                        <span className="font-semibold text-brand-700">โอนคืน {formatBaht(groupTotals.finalNetTransfer)} บาท</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      {groupRows.map(({ branch, period, storefrontSalesIncVat, deliverySalesIncVat, billingDate, dueDateIso }, i) => (
                        <BranchBillingRow
                          key={`${branch.id}-${i}`}
                          branchId={branch.id}
                          branchName={branch.name}
                          periodLabel={`${period.label} (${formatThaiDate(period.periodStart)} – ${formatThaiDate(period.periodEnd)})`}
                          periodStart={toISODate(period.periodStart)}
                          periodEnd={toISODate(period.periodEnd)}
                          gpPercentStorefront={branch.rentConfig?.gpPercentStorefront ?? 0}
                          gpPercentDelivery={branch.rentConfig?.gpPercentDelivery ?? 0}
                          initialStorefrontIncVat={storefrontSalesIncVat}
                          initialDeliveryIncVat={deliverySalesIncVat}
                          initialBillingDate={billingDate}
                          dueDateIso={dueDateIso}
                          paymentDelayDays={branch.creditTermConfig?.paymentDelayDays ?? null}
                          appliesWht={group.usesWithholdingCert}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}

      {rows.length === 0 && (
        <p className="text-sm text-gray-400">
          ยังไม่มีสาขาที่กำหนดประเภทวางบิลไว้ — ไปที่{" "}
          <Link href="/credit-term/billing/settings" className="text-brand-600 hover:underline">
            ตั้งค่าประเภท/สาขา
          </Link>{" "}
          เพื่อกำหนดก่อน
        </p>
      )}
    </div>
  );
}
