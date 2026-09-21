import Link from "next/link";
import { prisma } from "@lamunn/db-finance";
import { requireSectionPage } from "@/lib/permissions";
import BillingGroupSettings from "@/components/BillingGroupSettings";
import BranchBillingGroupAssign from "@/components/BranchBillingGroupAssign";

export default async function BillingSettingsPage() {
  await requireSectionPage("CREDIT_TERM", "edit");
  const [groups, branches] = await Promise.all([
    prisma.billingGroup.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.branch.findMany({
      where: { type: "CREDIT_TERM" },
      orderBy: { sortOrder: "asc" },
      include: { creditTermConfig: true, rentConfig: true },
    }),
  ]);

  const branchRows = branches.map((b) => ({
    branchId: b.id,
    branchName: b.name,
    billingGroupId: b.creditTermConfig?.billingGroupId ?? null,
    billingDueDays: b.creditTermConfig?.billingDueDays ?? null,
    paymentDelayDays: b.creditTermConfig?.paymentDelayDays ?? null,
    gpPercentStorefront: b.rentConfig?.gpPercentStorefront ?? 0,
    gpPercentDelivery: b.rentConfig?.gpPercentDelivery ?? 0,
    mallLegalName: b.creditTermConfig?.mallLegalName ?? null,
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">ตั้งค่าวางบิล — ประเภทและเอกสาร</h1>
        <Link href="/credit-term/billing" className="text-sm text-brand-600 hover:underline">
          ← กลับไปหน้าวางบิล
        </Link>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-gray-700">
        ประเภทวางบิล — แต่ละประเภทใช้เอกสารไม่เหมือนกัน (เช่น The Mall Group, Central, Tops)
      </h2>
      <div className="mb-8">
        <BillingGroupSettings
          groups={groups.map((g) => ({
            id: g.id,
            name: g.name,
            usesSummarySheet: g.usesSummarySheet,
            usesPaymentReceipt: g.usesPaymentReceipt,
            usesTaxInvoice: g.usesTaxInvoice,
            usesWithholdingCert: g.usesWithholdingCert,
          }))}
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-gray-700">
        ตั้งค่ารายสาขา — ประเภทวางบิล, GP หน้าร้าน/Delivery, กำหนดวางบิล, และวันที่คาดว่าเงินจะโอนเข้าหลังวางบิล
      </h2>
      <p className="mb-3 text-xs text-gray-400">แก้ไขแล้วบันทึกทันทีเมื่อออกจากช่อง (สำหรับ % และจำนวนวัน)</p>
      <BranchBillingGroupAssign rows={branchRows} groups={groups.map((g) => ({ id: g.id, name: g.name }))} />
    </div>
  );
}
