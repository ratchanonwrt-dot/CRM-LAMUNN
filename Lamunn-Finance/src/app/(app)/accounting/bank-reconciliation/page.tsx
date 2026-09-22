import BankReconciliationUpload from "@/components/accounting/BankReconciliationUpload";
import { requireSectionPage } from "@/lib/permissions";

export default async function BankReconciliationPage() {
  await requireSectionPage("ACCOUNTING");

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-gray-900">กระทบยอดเงินฝากธนาคาร</h1>
      <p className="mb-5 text-sm text-gray-500">
        เปรียบเทียบรายการเดินบัญชีจากธนาคารกับรายการในบัญชี เพื่อหารายการที่ตรงกัน รายการค้าง และยอดผลต่าง
      </p>
      <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        หน้านี้ใช้ตรวจสอบและกระทบยอดเท่านั้น — จะไม่สร้างใบสำคัญ ไม่แก้สมุดรายวัน และไม่นำรายการไปลงบัญชี
      </div>
      <BankReconciliationUpload />
    </div>
  );
}
