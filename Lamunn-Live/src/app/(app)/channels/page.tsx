import { prisma } from "@lamunn/db-live";
import { requirePageRole } from "@/lib/requirePageRole";
import ChannelManager from "@/components/ChannelManager";

export default async function ChannelsPage() {
  await requirePageRole(["SUPER_ADMIN", "MANAGER"]);
  const channels = await prisma.channel.findMany({
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { sessions: true } } },
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-gray-800">ช่องทางไลฟ์ ({channels.length})</h1>
      <p className="mb-6 text-sm text-gray-500">แพลตฟอร์มที่ใช้ไลฟ์ — แยกไว้เพื่อให้เทียบกันได้ว่าช่องทางไหนคนดู/ยอดขายดีกว่า · คอลัมน์ &quot;เว็บจอง&quot; คือเปิดให้คนภายนอกขอจองช่องนั้นผ่าน lamunn-livebook ได้หรือไม่</p>
      <ChannelManager
        channels={channels.map((c) => ({
          id: c.id,
          name: c.name,
          sortOrder: c.sortOrder,
          isActive: c.isActive,
          publicBooking: c.publicBooking,
          sessionCount: c._count.sessions,
        }))}
      />
    </div>
  );
}
