import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getPermissionMatrix, FEATURES, ROLES, roleLabel } from "@lamunn/db";
import RolePermissionMatrix from "@/components/RolePermissionMatrix";

// SUPER_ADMIN-only, hardcoded (not part of the permission table it edits) so no
// role can ever configure its own way into this page.
export default async function RolePermissionsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/admin");

  const matrix = await getPermissionMatrix();

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-gray-800">ตั้งค่าสิทธิ</h1>
      <p className="mb-6 text-sm text-gray-500">กำหนดว่าพนักงานแต่ละ role เข้าเมนูไหนได้บ้าง — ผู้จัดการ (Manager) เข้าได้ทุกเมนูเสมอ แก้ไม่ได้ เพื่อไม่ให้ล็อกตัวเองออกจากระบบ</p>
      <RolePermissionMatrix
        features={FEATURES.map((f) => ({ key: f.key, label: f.label }))}
        roles={ROLES.map((r) => ({ key: r, label: roleLabel[r], locked: r === "SUPER_ADMIN" }))}
        matrix={matrix}
      />
    </div>
  );
}
