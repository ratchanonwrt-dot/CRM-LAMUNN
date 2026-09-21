import { notFound } from "next/navigation";
import { prisma } from "@lamunn/db-catering";
import { requirePageRole } from "@/lib/requirePageRole";
import PickupOrderEditForm from "@/components/PickupOrderEditForm";

export default async function PickupOrderDetailPage({ params }: { params: { id: string } }) {
  await requirePageRole();

  const [order, branches] = await Promise.all([
    prisma.pickupOrder.findUnique({ where: { id: params.id } }),
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!order) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">ออเดอร์นัดรับ — {order.customerName}</h1>
      <PickupOrderEditForm
        order={{ ...order, orderDate: order.orderDate.toISOString(), pickupDate: order.pickupDate.toISOString() }}
        branches={branches}
      />
    </div>
  );
}
