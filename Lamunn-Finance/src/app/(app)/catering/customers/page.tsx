import { prisma } from "@lamunn/db-finance";
import { requireSectionPage } from "@/lib/permissions";
import { customerSourceLabel } from "@/lib/format";
import EditableCustomersTable from "@/components/catering/EditableCustomersTable";

export default async function CustomersPage({ searchParams }: { searchParams: { source?: string } }) {
  await requireSectionPage("CATERING");
  const { source } = searchParams;

  const customers = await prisma.customer.findMany({
    where: source ? { source: source as never } : {},
    include: { bookings: { select: { totalAmount: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });

  const sourceCounts = customers.reduce<Record<string, number>>((acc, c) => {
    const key = c.source ?? "ไม่ระบุ";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const rows = customers.map((c) => {
    const validBookings = c.bookings.filter((b) => b.status !== "CANCELLED");
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      source: c.source,
      bookingCount: validBookings.length,
      totalAmount: validBookings.reduce((a, b) => a + b.totalAmount, 0),
    };
  });

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-800">ลูกค้า ({customers.length})</h1>
      <p className="mb-6 text-sm text-gray-500">
        สำหรับดูว่าลูกค้ามาจากช่องทางไหนบ้าง และใครเป็นลูกค้าประจำ — แก้ไขชื่อ/เบอร์โทรได้โดยคลิกที่ช่องแล้วพิมพ์ทับ (บันทึกอัตโนมัติเมื่อคลิกออก)
      </p>

      <div className="mb-6 flex flex-wrap gap-3">
        {Object.entries(sourceCounts).map(([key, count]) => (
          <div key={key} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs text-gray-500">{customerSourceLabel[key] ?? key}</p>
            <p className="text-lg font-bold text-brand-700">{count}</p>
          </div>
        ))}
      </div>

      <EditableCustomersTable customers={rows} />
    </div>
  );
}
