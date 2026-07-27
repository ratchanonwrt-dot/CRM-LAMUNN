import { prisma } from "@lamunn/db-finance";
import DateFilterBar from "@/components/DateFilterBar";
import CompanyChannelForm from "@/components/CompanyChannelForm";
import { parseDateOnly } from "@/lib/dates";

export default async function CompanyChannelEntryPage({ searchParams }: { searchParams: { date?: string } }) {
  const date = searchParams.date ?? new Date().toISOString().slice(0, 10);
  const existing = await prisma.companyChannelDaily.findUnique({ where: { date: parseDateOnly(date) } });

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-800">กรอกยอดขาย E-Commerce กลาง</h1>
      <p className="mb-6 text-sm text-gray-500">
        ยอดขายช่องทาง TikTok / FB-Line / รับหน้าร้าน / Catering ที่ไม่ได้แยกรายสาขา — กรอกวันละ 1 ครั้ง
      </p>

      <DateFilterBar basePath="/entry/company" date={date} />

      <CompanyChannelForm
        key={date}
        date={date}
        existing={
          existing
            ? {
                tiktok: existing.tiktok,
                fbLine: existing.fbLine,
                pickup: existing.pickup,
                catering: existing.catering,
                depositGrab: existing.depositGrab,
                depositLineman: existing.depositLineman,
                depositStorefront: existing.depositStorefront,
                depositEcom: existing.depositEcom,
                note: existing.note,
              }
            : null
        }
      />
    </div>
  );
}
