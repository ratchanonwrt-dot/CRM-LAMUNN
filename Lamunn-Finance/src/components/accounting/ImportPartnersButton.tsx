"use client";

import ImportExcelButton from "@/components/accounting/ImportExcelButton";

/** นำเข้าฐานข้อมูลลูกหนี้/เจ้าหนี้จากไฟล์ Excel/CSV — ชื่อใหม่สร้างเพิ่ม ชื่อเดิมอัพเดตข้อมูล */
export default function ImportPartnersButton() {
  return (
    <ImportExcelButton
      endpoint="/api/accounting/partners/import"
      label="นำเข้าคู่ค้าจาก Excel"
      createdLabel="เพิ่มใหม่"
      updatedLabel="อัพเดต"
    />
  );
}
