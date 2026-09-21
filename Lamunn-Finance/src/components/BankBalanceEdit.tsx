"use client";

import SettingAmountEdit from "@/components/SettingAmountEdit";
import { useCompanyLive } from "@/components/CompanyStatusLive";

/** เงินในบัญชี (กรอกเอง) — ค่าอยู่ใน CompanyStatusProvider ของหน้า จึงอัปเดตตัวเลข + ยอดรวมทันทีที่กดบันทึก */
export default function BankBalanceEdit() {
  const { bank, setBank } = useCompanyLive();
  return <SettingAmountEdit value={bank} onCommit={setBank} endpoint="/api/company-status/bank-balance" />;
}
