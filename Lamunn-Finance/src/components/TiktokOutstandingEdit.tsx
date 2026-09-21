"use client";

import SettingAmountEdit from "@/components/SettingAmountEdit";
import { useCompanyLive } from "@/components/CompanyStatusLive";

/** เงินค้าง Tiktok (กรอกเอง) — ค่าอยู่ใน CompanyStatusProvider ของหน้า จึงอัปเดตตัวเลข + ยอดรวมทันทีที่กดบันทึก */
export default function TiktokOutstandingEdit() {
  const { tiktok, setTiktok } = useCompanyLive();
  return <SettingAmountEdit value={tiktok} onCommit={setTiktok} endpoint="/api/company-status/tiktok-outstanding" />;
}
