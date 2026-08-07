import { prisma } from "@lamunn/db";
import { requirePageRole } from "@/lib/requirePageRole";
import EnterPointsForm from "@/components/EnterPointsForm";

export default async function EnterPointsPage() {
  const user = await requirePageRole("enterPoints");
  const branches = await prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-xl font-bold text-gray-800">กรอกคะแนน</h1>
      <p className="mb-6 text-sm text-gray-500">กรอกเบอร์โทรลูกค้า จำนวนแต้ม และสาขา แต้มจะเข้าระบบทันที (ใช้สำหรับลูกค้าที่เป็นสมาชิกอยู่แล้วเท่านั้น)</p>
      <EnterPointsForm
        branches={branches.map((b) => ({ id: b.id, name: b.name }))}
        defaultBranchId={user.branchId ?? ""}
      />
    </div>
  );
}
