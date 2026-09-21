import { prisma } from "@lamunn/db-finance";
import { requirePageRole } from "@/lib/requirePageRole";
import StaffManager from "@/components/StaffManager";

export default async function StaffPage() {
  const staff = await requirePageRole(["SUPER_ADMIN"]);

  const users = await prisma.staffUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-800">จัดการผู้ใช้งาน</h1>
      <p className="mb-6 text-sm text-gray-500">
        เพิ่มบัญชีให้พนักงาน/ผู้จัดการ/บัญชีเข้ามาใช้งานได้ — กำหนดตำแหน่งเป็น &quot;Accounting Team&quot; (ดูอย่างเดียว) &quot;Catering Team&quot;
        (ดู/แก้ไขได้เฉพาะส่วน Catering) &quot;Manager&quot; (แก้ไขได้ทุกอย่างยกเว้นจัดการผู้ใช้งาน) หรือ &quot;ผู้ดูแลระบบสูงสุด&quot; (ทำได้ทุกอย่าง)
        — ไปที่หน้า &quot;จัดการสิทธิ์ตำแหน่ง&quot; เพื่อกำหนดว่าแต่ละตำแหน่งดู/แก้ไขส่วนไหนได้บ้าง
      </p>

      <StaffManager
        initialUsers={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
        currentStaffId={staff.staffId}
      />
    </div>
  );
}
