import Link from "next/link";
import { prisma } from "@lamunn/db-live";
import { requirePageRole } from "@/lib/requirePageRole";
import NewSessionForm from "@/components/NewSessionForm";

export default async function NewSessionPage() {
  await requirePageRole();
  const channels = await prisma.channel.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });

  // วันที่วันนี้ตามเวลาไทย (server อาจอยู่ UTC)
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const today = now.toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/sessions" className="text-sm text-gray-400 hover:text-gray-600">
        ← กลับไปรายการรอบไลฟ์
      </Link>
      <h1 className="mb-1 mt-2 text-xl font-bold text-gray-800">เปิดรอบไลฟ์ใหม่</h1>
      <p className="mb-6 text-sm text-gray-500">สร้างรอบก่อน แล้วค่อยบันทึกยอดคนดู/ยอดขายของแต่ละช่วงเวลาในหน้าถัดไป</p>
      <NewSessionForm channels={channels.map((c) => ({ id: c.id, name: c.name }))} defaultDate={today} />
    </div>
  );
}
