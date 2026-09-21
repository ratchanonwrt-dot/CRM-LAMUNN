import { prisma } from "@lamunn/db-finance";

/**
 * บันทึกประวัติการทำงาน — เน้นเฉพาะการกระทำสำคัญ/ย้อนกลับไม่ได้ (ลบ, จัดการผู้ใช้/สิทธิ์, ตั้งค่าระบบ)
 * ไม่ใช่ทุก request เพื่อไม่ให้ตารางบวมจนดูยาก การบันทึกล้มเหลวต้องไม่ทำให้การกระทำจริงล้มเหลวตามไปด้วย
 * จึงกลืน error ทิ้งเงียบๆ (best-effort) แทนที่จะ throw
 */
export async function logActivity(params: {
  staffId: string | null;
  staffName: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  entity: string;
  summary: string;
}): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        staffId: params.staffId,
        staffName: params.staffName,
        action: params.action,
        entity: params.entity,
        summary: params.summary,
      },
    });
  } catch {
    // best-effort — ไม่ให้การ log ล้มเหลวไปกระทบการกระทำจริงที่เพิ่งทำสำเร็จ
  }
}
