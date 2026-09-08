import { prisma } from "@lamunn/db-live";
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
        เพิ่มบัญชีให้พนักงาน/ผู้จัดการเข้ามาใช้งานได้ — กำหนดสิทธิ์เป็น &quot;พนักงาน&quot; (บันทึกยอดไลฟ์ได้ แต่แก้ตั้งค่า/ลบไม่ได้) &quot;ผู้จัดการ&quot;
        (แก้ไขได้ทุกอย่างยกเว้นจัดการผู้ใช้งาน) หรือ &quot;ผู้ดูแลระบบสูงสุด&quot; (ทำได้ทุกอย่าง รวมถึงเพิ่ม/ลบผู้ใช้งาน)
      </p>

      <StaffManager
        initialUsers={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
        currentStaffId={staff.staffId}
      />
    </div>
  );
}
