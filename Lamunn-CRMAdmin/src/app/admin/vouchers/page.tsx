import { prisma } from "@lamunn/db";
import { requirePageRole } from "@/lib/requirePageRole";
import VoucherForm from "@/components/VoucherForm";

export default async function VouchersPage() {
  await requirePageRole("vouchers");
  const rewards = await prisma.reward.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-xl font-bold text-gray-800">Voucher</h1>
      <p className="mb-6 text-sm text-gray-500">
        กรอกเบอร์โทรลูกค้าและเลือกของรางวัล ระบบจะออกวอเชอร์ให้ทันที — ลูกค้ากดดูคูปองที่หน้า &quot;คูปองของฉัน&quot; แล้วเอา QR ไปให้พนักงานหน้าร้านสแกนเพื่อรับของ (ไม่หักแต้ม)
      </p>
      <VoucherForm rewards={rewards.map((r) => ({ id: r.id, name: r.name, stock: r.stock }))} />
    </div>
  );
}
