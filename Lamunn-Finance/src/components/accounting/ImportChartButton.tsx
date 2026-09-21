"use client";

import ImportExcelButton from "@/components/accounting/ImportExcelButton";

/** นำเข้าผังบัญชีจากไฟล์ Excel/CSV — รหัสใหม่สร้างเพิ่ม รหัสเดิมอัพเดตชื่อ */
export default function ImportChartButton() {
  return (
    <ImportExcelButton
      endpoint="/api/accounting/accounts/import"
      label="นำเข้าผังจาก Excel"
      createdLabel="เพิ่มบัญชีใหม่"
      updatedLabel="อัพเดตชื่อ"
    />
  );
}
