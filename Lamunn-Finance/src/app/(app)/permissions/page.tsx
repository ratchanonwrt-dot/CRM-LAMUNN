import { prisma } from "@lamunn/db-finance";
import { requirePageRole } from "@/lib/requirePageRole";
import PermissionsMatrix from "@/components/PermissionsMatrix";

export default async function PermissionsPage() {
  await requirePageRole(["SUPER_ADMIN"]);

  const rows = await prisma.rolePermission.findMany();

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-800">จัดการสิทธิ์ตำแหน่ง</h1>
      <p className="mb-6 text-sm text-gray-500">
        กำหนดว่าแต่ละตำแหน่งดู/แก้ไขข้อมูลส่วนไหนได้บ้าง — ติ๊กแล้วบันทึกทันที &quot;ผู้ดูแลระบบสูงสุด&quot; ทำได้ทุกอย่างเสมอ แก้ไม่ได้
        (กันล็อกตัวเองออกจากระบบ) ส่วน &quot;จัดการผู้ใช้งาน&quot; และหน้านี้เองสงวนไว้สำหรับผู้ดูแลระบบสูงสุดเท่านั้น ไม่อยู่ในตารางนี้
      </p>

      <PermissionsMatrix initialRows={rows} />
    </div>
  );
}
