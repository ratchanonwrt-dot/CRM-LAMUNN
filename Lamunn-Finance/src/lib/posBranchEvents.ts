import type { PosBranchEvent } from "@lamunn/db-finance";

/** ข้อความภาษาไทยของสิ่งที่ sync ทำกับสาขา — ใช้ทั้งบันทึกประวัติและแจ้งบนหน้าเว็บ */
export function describeBranchEvents(events: PosBranchEvent[]): string[] {
  return events.map((e) => {
    switch (e.kind) {
      case "created":
        return `เพิ่มสาขาใหม่จาก POS อัตโนมัติ: ${e.name} (รหัส POS ${e.posCode}) — ตั้งเป็น "เงินสด" ไว้ก่อน ถ้าเป็น Credit Term ให้แก้ที่ตั้งค่าสาขา`;
      case "linked":
        return `เชื่อมสาขา ${e.name} กับ POS (รหัส ${e.posCode}) และเปิดใช้งานอัตโนมัติ เพราะ POS มียอดขาย`;
      case "reactivated":
        return `เปิดสาขา ${e.name} กลับมาใช้งานอัตโนมัติ เพราะ POS (รหัส ${e.posCode}) มียอดขายใหม่`;
    }
  });
}
