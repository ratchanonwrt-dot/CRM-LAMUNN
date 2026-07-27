import Link from "next/link";
import { prisma } from "@lamunn/db-finance";
import { requirePageRole } from "@/lib/requirePageRole";
import CreditTermCycleForm from "@/components/CreditTermCycleForm";

export default async function CreditTermSettingsPage() {
  await requirePageRole(["ADMIN"]);
  const branches = await prisma.branch.findMany({
    where: { type: "CREDIT_TERM" },
    orderBy: { sortOrder: "asc" },
    include: { rentConfig: true, creditTermConfig: true },
  });

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">ตั้งค่ารอบจ่ายเงิน Credit Term</h1>
        <Link href="/credit-term" className="text-sm text-brand-600 hover:underline">
          ← กลับไปหน้า Credit Term
        </Link>
      </div>
      <p className="mb-6 text-sm text-gray-500">
        แต่ละสาขากำหนดวันขายเริ่ม/สิ้นสุดรอบ และวันเงินเข้าเองได้อิสระ — รองรับทั้งแบบแบ่ง 2 รอบ (1-15 / 16-สิ้นเดือน) และแบบเต็มเดือน
        (แก้ GP% หรือค่าเช่าที่หน้า &quot;ตั้งค่าสาขา/ค่าเช่า&quot;)
      </p>

      <div className="flex flex-col gap-6">
        {branches.map((b) => (
          <CreditTermCycleForm
            key={b.id}
            branchId={b.id}
            branchName={b.name}
            gpPercentStorefront={b.rentConfig?.gpPercentStorefront ?? 0}
            gpPercentDelivery={b.rentConfig?.gpPercentDelivery ?? 0}
            cycle={b.creditTermConfig}
          />
        ))}
      </div>
    </div>
  );
}
