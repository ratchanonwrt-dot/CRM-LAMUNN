import { prisma } from "@lamunn/db";
import { requirePageRole } from "@/lib/requirePageRole";
import LuckyDrawForm from "@/components/LuckyDrawForm";

export default async function LuckyDrawPage() {
  await requirePageRole("luckyDraw");
  const rewards = await prisma.reward.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-xl font-bold text-gray-800">Lucky Draw</h1>
      <p className="mb-6 text-sm text-gray-500">
        กรอกเบอร์โทรผู้โชคดีและเลือกของรางวัล ระบบจะออกคูปองให้ทันที — ลูกค้ากดดูคูปองที่หน้า &quot;คูปองของฉัน&quot; แล้วเอา QR ไปให้พนักงานหน้าร้านสแกนเพื่อรับของ (ไม่หักแต้ม)
      </p>
      <LuckyDrawForm rewards={rewards.map((r) => ({ id: r.id, name: r.name, stock: r.stock }))} />
    </div>
  );
}
