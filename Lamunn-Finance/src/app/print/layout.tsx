/** เลย์เอาต์ของหน้าที่ไว้พิมพ์โดยเฉพาะ — ไม่มีเมนูซ้าย ไม่มีแท็บ
 *
 * วางไว้นอกกลุ่ม (app) โดยตั้งใจ เพราะถ้าอยู่ในนั้นจะมี Nav กับแถบแท็บติดไปกับกระดาษด้วย
 * (การซ่อนด้วย CSS ตอนพิมพ์ทำได้ แต่ต้องไปแก้ไฟล์กลางที่ใช้ร่วมกับส่วนการเงิน)
 * สิทธิ์ยังถูกตรวจตามปกติ — middleware คุ้มทุก path ที่ไม่ใช่ /login และหน้าเองก็เรียก requireSectionPage ซ้ำอีกชั้น
 */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-100 p-4 print:bg-white print:p-0">{children}</div>;
}
