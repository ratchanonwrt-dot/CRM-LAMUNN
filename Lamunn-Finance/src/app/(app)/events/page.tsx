import { prisma } from "@lamunn/db-finance";
import AddEventForm from "@/components/AddEventForm";
import DeleteEventButton from "@/components/DeleteEventButton";
import { formatBaht, formatThaiDate } from "@/lib/format";

export default async function EventsPage() {
  const events = await prisma.eventSale.findMany({ orderBy: { startDate: "desc" } });

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-800">Event ชั่วคราว</h1>
      <p className="mb-6 text-sm text-gray-500">
        บันทึกยอดขายของงาน Event / บูธชั่วคราวที่ไม่ใช่สาขาประจำ — ไม่รวมเข้ายอดขายบริษัทหลัก
      </p>

      <AddEventForm />

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">ชื่องาน</th>
              <th className="px-3 py-2">ช่วงวันที่</th>
              <th className="px-3 py-2">สถานที่</th>
              <th className="px-3 py-2 text-right">หน้าร้าน</th>
              <th className="px-3 py-2 text-right">Grab</th>
              <th className="px-3 py-2 text-right">Lineman</th>
              <th className="px-3 py-2 text-right">รวม</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-gray-800">{e.name}</td>
                <td className="px-3 py-2 text-gray-500">
                  {formatThaiDate(e.startDate)} – {formatThaiDate(e.endDate)}
                </td>
                <td className="px-3 py-2 text-gray-500">{e.location ?? "-"}</td>
                <td className="px-3 py-2 text-right">{formatBaht(e.storefront)}</td>
                <td className="px-3 py-2 text-right">{formatBaht(e.grab)}</td>
                <td className="px-3 py-2 text-right">{formatBaht(e.lineman)}</td>
                <td className="px-3 py-2 text-right font-medium">{formatBaht(e.storefront + e.grab + e.lineman)}</td>
                <td className="px-3 py-2">
                  <DeleteEventButton id={e.id} />
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-400" colSpan={8}>
                  ยังไม่มี Event
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
