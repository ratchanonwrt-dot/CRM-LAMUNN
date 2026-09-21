import Link from "next/link";
import { requireSectionPage } from "@/lib/permissions";
import { monthRange } from "@/lib/dates";
import { thaiMonthLabel } from "@/lib/format";
import { getAllSettings } from "@/lib/settings";
import MonthFilterBar from "@/components/MonthFilterBar";
import DailyPostingPanel from "@/components/accounting/DailyPostingPanel";
import { previewDailySalesMonth } from "@/lib/accounting/dailySales";

export const dynamic = "force-dynamic";

export default async function DailyPostingPage({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  const { permissions } = await requireSectionPage("ACCOUNTING");

  const now = new Date();
  const year = Number(searchParams.year) || now.getUTCFullYear();
  const month = Number(searchParams.month) || now.getUTCMonth() + 1;
  const { start, end } = monthRange(year, month - 1);

  const settings = await getAllSettings();
  const rows = await previewDailySalesMonth(start, end, Number(settings.vatRate));

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-gray-900">ลงบัญชียอดขายรายวัน</h1>
      <p className="mb-4 text-sm text-gray-500">
        ดึงยอดที่หน้าร้านคีย์ไว้แล้วมาสร้างใบสำคัญขาย — ไม่ต้องคีย์ยอดซ้ำ เดือน {thaiMonthLabel(year, month - 1)}
      </p>

      <div className="mb-5 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3 text-sm text-gray-700">
        <p className="mb-1 font-semibold text-brand-800">ยอดจะไม่ถูกนับซ้ำ</p>
        <p>
          รายได้ลงบัญชีจาก <b>ยอดขายรวมของวัน</b> ครั้งเดียว ใบกำกับภาษีเต็มรูปที่ออกให้ลูกค้าจากบิลของวันนั้น
          <b> ไม่สร้างรายการรายได้ซ้ำ</b> เพราะยอดรวมอยู่ในนั้นแล้ว — คอลัมน์ &ldquo;ใบกำกับเต็มรูป&rdquo;
          มีไว้แยกให้เห็นว่าส่วนไหนออกใบเต็มรูป ส่วนไหนเป็นใบกำกับอย่างย่อ สำหรับใช้ทำรายงานภาษีขาย
          ไม่ต้องมานั่งดึงยอดออกเองเหมือนที่ทำอยู่ตอนนี้
        </p>
        <p className="mt-1 text-xs text-gray-500">
          ยกเว้นใบกำกับที่บันทึกไว้ว่า &ldquo;ขายนอกยอดรวม&rdquo; (เช่น ขายส่ง/จัดเลี้ยงที่ไม่ผ่าน POS) ใบพวกนั้นจะลงบัญชีของตัวเองแยกที่หน้า{" "}
          <Link href="/accounting/tax-invoices" className="underline">
            ใบกำกับภาษีเต็มรูป
          </Link>
        </p>
      </div>

      <MonthFilterBar basePath="/accounting/daily-posting" year={year} month={month} />

      <DailyPostingPanel rows={rows} canEdit={permissions.ACCOUNTING.canEdit} />
    </div>
  );
}
