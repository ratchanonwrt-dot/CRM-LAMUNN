import { prisma } from "@lamunn/db";
import AddPointRuleForm from "@/components/AddPointRuleForm";
import DeleteButton from "@/components/DeleteButton";
import { requirePageRole } from "@/lib/requirePageRole";

export default async function PointRulesPage() {
  const user = await requirePageRole("pointRules");
  const role = user.role!;

  const [rules, branches] = await Promise.all([
    prisma.pointRule.findMany({
      include: { branch: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-800">กติกาสะสมแต้ม</h1>
      <p className="mb-6 text-sm text-gray-500">กำหนดอัตราแลกบาทเป็นแต้ม เช่น 25 บาท = 1 แต้ม กติกาเฉพาะสาขาจะมีผลเหนือกติกาทั่วไป</p>

      <AddPointRuleForm branches={branches} allowGlobal={role === "SUPER_ADMIN" || role === "MARKETING"} />

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">ชื่อกติกา</th>
              <th className="px-4 py-2">สาขา</th>
              <th className="px-4 py-2">อัตรา</th>
              <th className="px-4 py-2">ยอดขั้นต่ำ</th>
              <th className="px-4 py-2">สถานะ</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2 text-gray-500">{r.branch ? `${r.branch.code} — ${r.branch.name}` : "ทุกสาขา"}</td>
                <td className="px-4 py-2">{Number(r.bahtPerPoint)} บาท / 1 แต้ม</td>
                <td className="px-4 py-2">{Number(r.minAmount)} บาท</td>
                <td className="px-4 py-2">{r.isActive ? "ใช้งาน" : "ปิด"}</td>
                <td className="px-4 py-2">
                  <DeleteButton endpoint={`/api/admin/point-rules/${r.id}`} confirmMessage={`ลบกติกา "${r.name}" ใช่ไหม?`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
