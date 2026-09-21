import { prisma } from "@lamunn/db-finance";
import { requirePageRole } from "@/lib/requirePageRole";

const ACTION_LABELS: Record<string, string> = {
  CREATE: "เพิ่ม",
  UPDATE: "แก้ไข",
  DELETE: "ลบ",
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700",
  UPDATE: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-700",
};

function formatDateTime(d: Date) {
  const thaiMonths = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543} ${hh}:${mm}`;
}

export default async function ActivityLogPage({ searchParams }: { searchParams: { staff?: string; entity?: string } }) {
  await requirePageRole(["SUPER_ADMIN"]);

  const { staff: staffFilter, entity: entityFilter } = searchParams;

  const [logs, staffOptions, entityOptions] = await Promise.all([
    prisma.activityLog.findMany({
      where: {
        ...(staffFilter ? { staffName: staffFilter } : {}),
        ...(entityFilter ? { entity: entityFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.activityLog.findMany({ distinct: ["staffName"], select: { staffName: true }, orderBy: { staffName: "asc" } }),
    prisma.activityLog.findMany({ distinct: ["entity"], select: { entity: true }, orderBy: { entity: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-800">ประวัติการทำงานในระบบ (Activity Log)</h1>
      <p className="mb-6 text-sm text-gray-500">
        บันทึกเฉพาะการกระทำสำคัญ/ย้อนกลับไม่ได้ — การลบข้อมูล, การจัดการผู้ใช้งาน/สิทธิ์, การแก้ไขค่าตั้งค่าระบบ, การปิดรอบ/ยกเลิก Credit Term
        (ไม่ได้บันทึกทุกการกรอกยอดขายประจำวัน เพื่อไม่ให้รายการบวมจนดูยาก) เก็บล่าสุด 300 รายการ
      </p>

      <form className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">พนักงาน</label>
          <select name="staff" defaultValue={staffFilter ?? ""} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 outline-none focus:border-brand-400 focus:bg-white">
            <option value="">ทั้งหมด</option>
            {staffOptions.map((s) => (
              <option key={s.staffName} value={s.staffName}>{s.staffName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">ประเภทข้อมูล</label>
          <select name="entity" defaultValue={entityFilter ?? ""} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 outline-none focus:border-brand-400 focus:bg-white">
            <option value="">ทั้งหมด</option>
            {entityOptions.map((e) => (
              <option key={e.entity} value={e.entity}>{e.entity}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-xl border border-gray-200 px-5 py-2.5 text-gray-600 hover:bg-gray-50">
          กรอง
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">เวลา</th>
              <th className="px-4 py-2">พนักงาน</th>
              <th className="px-4 py-2">การกระทำ</th>
              <th className="px-4 py-2">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-gray-100">
                <td className="px-4 py-2 whitespace-nowrap text-gray-500">{formatDateTime(log.createdAt)}</td>
                <td className="px-4 py-2 font-medium text-gray-800">{log.staffName}</td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-500"}`}>
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-700">{log.summary}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  ยังไม่มีประวัติ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
