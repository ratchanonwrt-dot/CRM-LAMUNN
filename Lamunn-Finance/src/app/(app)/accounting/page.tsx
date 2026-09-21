import Link from "next/link";
import { prisma } from "@lamunn/db-finance";
import { requireSectionPage } from "@/lib/permissions";
import { monthRange } from "@/lib/dates";
import { thaiMonthLabel } from "@/lib/format";
import { getAllSettings } from "@/lib/settings";
import MonthFilterBar from "@/components/MonthFilterBar";
import PeriodCloseButton from "@/components/accounting/PeriodCloseButton";
import { loadBalances, buildTrialBalance, buildIncomeStatement } from "@/lib/accounting/reports";
import { previewDailySalesMonth } from "@/lib/accounting/dailySales";
import { fmtSatang } from "@/lib/accounting/money";

export const dynamic = "force-dynamic";

export default async function AccountingHomePage({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  const { permissions } = await requireSectionPage("ACCOUNTING");
  const canEdit = permissions.ACCOUNTING.canEdit;

  const now = new Date();
  const year = Number(searchParams.year) || now.getUTCFullYear();
  const month = Number(searchParams.month) || now.getUTCMonth() + 1;
  const { start, end } = monthRange(year, month - 1);

  const settings = await getAllSettings();
  const vatRate = Number(settings.vatRate);

  const [accountCount, period, draftCount, balances, dailyRows] = await Promise.all([
    prisma.accAccount.count(),
    prisma.accPeriod.findUnique({ where: { year_month: { year, month } } }),
    prisma.accJournalEntry.count({ where: { status: "DRAFT", date: { gte: start, lte: end } } }),
    loadBalances({ from: start, to: end }),
    previewDailySalesMonth(start, end, vatRate),
  ]);

  const tb = buildTrialBalance(balances);
  const pl = buildIncomeStatement(balances);
  const unposted = dailyRows.filter((r) => !r.entryNo && r.gross > 0);
  const closed = period?.status === "CLOSED";

  if (accountCount === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
        <h1 className="text-lg font-bold text-gray-900">เริ่มใช้ระบบบัญชี</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500">
          ระบบนี้เป็นบัญชีคู่เต็มรูปแบบ ใช้แทน FlowAccount — ลงรายการครั้งเดียวแล้วออกงบทดลอง งบกำไรขาดทุน
          และงบแสดงฐานะการเงินได้เอง เริ่มด้วยการติดตั้งผังบัญชี
        </p>
        <Link
          href="/accounting/accounts"
          className="mt-5 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          ไปติดตั้งผังบัญชี
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-xl font-bold text-gray-900">ภาพรวมบัญชี</h1>
          <p className="text-sm text-gray-500">
            สถานะงวด {thaiMonthLabel(year, month - 1)} และงานที่ยังค้างก่อนปิดงบ
          </p>
        </div>
        {canEdit && <PeriodCloseButton year={year} month={month} closed={closed} />}
      </div>

      <MonthFilterBar basePath="/accounting" year={year} month={month} />

      <div
        className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
          closed ? "border-gray-300 bg-gray-100 text-gray-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"
        }`}
      >
        {closed
          ? `งวดนี้ปิดบัญชีแล้ว — บันทึกหรือแก้ไขรายการย้อนหลังไม่ได้ ถ้าต้องแก้ให้ออกใบสำคัญปรับปรุงในงวดที่ยังเปิดอยู่`
          : `งวดนี้ยังเปิดอยู่ — บันทึกรายการได้ตามปกติ`}
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          label="รายได้เดือนนี้"
          value={fmtSatang(pl.revenue.total, { zeroDash: false })}
          href={`/accounting/income-statement?year=${year}&month=${month}`}
        />
        <Card
          label="กำไร(ขาดทุน)สุทธิเดือนนี้"
          value={fmtSatang(pl.netProfit, { zeroDash: false })}
          tone={pl.netProfit < 0 ? "bad" : "good"}
          href={`/accounting/income-statement?year=${year}&month=${month}`}
        />
        <Card
          label="งบทดลอง"
          value={tb.balanced ? "ลงตัว" : "ไม่ลงตัว"}
          tone={tb.balanced ? "good" : "bad"}
          href={`/accounting/trial-balance?year=${year}&month=${month}`}
        />
        <Card
          label="ใบสำคัญร่างค้างอยู่"
          value={draftCount === 0 ? "ไม่มี" : `${draftCount} ใบ`}
          tone={draftCount === 0 ? "good" : "warn"}
          href={`/accounting/journal?year=${year}&month=${month}&status=DRAFT`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold text-gray-800">งานที่ต้องทำก่อนปิดงบเดือนนี้</h2>
          <ul className="space-y-2 text-sm">
            <Todo
              done={unposted.length === 0}
              text={
                unposted.length === 0
                  ? "ยอดขายรายวันลงบัญชีครบแล้ว"
                  : `ยังมียอดขาย ${unposted.length} วันที่ยังไม่ได้ลงบัญชี`
              }
              href={`/accounting/daily-posting?year=${year}&month=${month}`}
            />
            <Todo
              done={draftCount === 0}
              text={draftCount === 0 ? "ไม่มีใบสำคัญร่างค้าง" : `มีใบสำคัญร่าง ${draftCount} ใบรอผ่านรายการ`}
              href={`/accounting/journal?year=${year}&month=${month}&status=DRAFT`}
            />
            <Todo
              done={tb.balanced}
              text={tb.balanced ? "งบทดลองลงตัว" : "งบทดลองยังไม่ลงตัว ตรวจสมุดรายวัน"}
              href={`/accounting/trial-balance?year=${year}&month=${month}`}
            />
            <Todo done={closed} text={closed ? "ปิดงวดแล้ว" : "ยังไม่ได้ปิดงวด"} />
          </ul>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold text-gray-800">งบที่ออกได้ตอนนี้</h2>
          <ul className="space-y-1.5 text-sm">
            <StatementLink href={`/accounting/trial-balance?year=${year}&month=${month}`} label="งบทดลอง" hint="ตรวจเดบิต–เครดิตก่อนปิดงบ" />
            <StatementLink
              href={`/accounting/income-statement?year=${year}&month=${month}`}
              label="งบกำไรขาดทุน"
              hint="เดือนนี้ + สะสมตั้งแต่ต้นรอบบัญชี"
            />
            <StatementLink
              href={`/accounting/balance-sheet?year=${year}&month=${month}`}
              label="งบแสดงฐานะการเงิน (งบดุล)"
              hint="สินทรัพย์ = หนี้สิน + ส่วนของผู้ถือหุ้น"
            />
          </ul>
          <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-400">
            อัตราภาษีมูลค่าเพิ่มที่ใช้อยู่: {(vatRate * 100).toFixed(0)}% · แก้ได้ที่{" "}
            <Link href="/settings" className="underline">
              ตั้งค่าระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, tone, href }: { label: string; value: string; tone?: "good" | "bad" | "warn"; href?: string }) {
  const color = tone === "bad" ? "text-rose-600" : tone === "warn" ? "text-amber-600" : tone === "good" ? "text-emerald-600" : "text-gray-900";
  const body = (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-brand-300">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-0.5 text-lg font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function Todo({ done, text, href }: { done: boolean; text: string; href?: string }) {
  const content = (
    <span className={done ? "text-gray-500" : "text-gray-800"}>
      <span className={`mr-2 ${done ? "text-emerald-500" : "text-amber-500"}`}>{done ? "✓" : "•"}</span>
      {text}
    </span>
  );
  return <li>{href ? <Link href={href} className="hover:underline">{content}</Link> : content}</li>;
}

function StatementLink({ href, label, hint }: { href: string; label: string; hint: string }) {
  return (
    <li>
      <Link href={href} className="group flex items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-50">
        <span className="font-medium text-gray-800 group-hover:text-brand-700">{label}</span>
        <span className="text-xs text-gray-400">{hint}</span>
      </Link>
    </li>
  );
}
