import { getAuditLogs } from "@lamunn/db";
import { requirePageRole } from "@/lib/requirePageRole";
import { format } from "date-fns";

const actionLabel: Record<string, string> = {
  CREATE: "สร้าง",
  UPDATE: "แก้ไข",
  DELETE: "ลบ",
};

const entityLabel: Record<string, string> = {
  Reward: "รางวัล",
  MembershipTier: "ระดับสมาชิก",
  AppSettings: "ตั้งค่าหน้าตาแอป",
};

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: "ผู้จัดการ (Manager)",
  SUPERVISOR: "ผู้ดูแลสาขา (Supervisor)",
  STAFF: "พนักงาน (Staff)",
  MARKETING: "การตลาด (Marketing)",
};

export default async function AuditLogPage() {
  await requirePageRole("auditLog");
  const logs = await getAuditLogs();

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-800">ประวัติการแก้ไข</h1>
      <p className="mb-6 text-sm text-gray-500">บันทึกย้อนหลังว่า account ไหนแก้อะไรไปบ้าง (รางวัล, ระดับสมาชิก, ตั้งค่าหน้าตาแอป) — ล่าสุด {logs.length} รายการ</p>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">วันเวลา</th>
              <th className="px-4 py-2">พนักงาน</th>
              <th className="px-4 py-2">บทบาท</th>
              <th className="px-4 py-2">รายการ</th>
              <th className="px-4 py-2">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  ยังไม่มีประวัติการแก้ไข
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-500">{format(log.createdAt, "d MMM yyyy HH:mm")}</td>
                <td className="px-4 py-2 font-medium text-gray-800">{log.staffName}</td>
                <td className="px-4 py-2 text-gray-500">{roleLabel[log.staffRole] ?? log.staffRole}</td>
                <td className="px-4 py-2 text-gray-500">
                  {actionLabel[log.action] ?? log.action} · {entityLabel[log.entityType] ?? log.entityType}
                </td>
                <td className="px-4 py-2 text-gray-600">{log.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
