import { notFound } from "next/navigation";
import { prisma } from "@lamunn/db-finance";
import { requireSectionPage } from "@/lib/permissions";
import PickupOrderEditForm from "@/components/catering/PickupOrderEditForm";
import PickupOrderItemsPanel from "@/components/catering/PickupOrderItemsPanel";
import DeletePickupOrderButton from "@/components/catering/DeletePickupOrderButton";

export default async function PickupOrderDetailPage({ params }: { params: { id: string } }) {
  await requireSectionPage("CATERING");

  const [order, branches, menuItems] = await Promise.all([
    prisma.pickupOrder.findUnique({ where: { id: params.id }, include: { items: { orderBy: { sortOrder: "asc" } } } }),
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.cateringMenuItem.findMany({ where: { isActive: true, category: { in: ["MENU", "SERVICE"] } }, orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
  ]);
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h1 className="text-xl font-bold text-gray-800">ออเดอร์นัดรับ — {order.customerName}</h1>
        <DeletePickupOrderButton id={order.id} redirectAfter />
      </div>
      <PickupOrderEditForm
        key={order.amount}
        order={{ ...order, orderDate: order.orderDate.toISOString(), pickupDate: order.pickupDate.toISOString() }}
        branches={branches}
        hasItems={order.items.length > 0}
      />
      <PickupOrderItemsPanel
        orderId={order.id}
        items={order.items}
        menuItems={menuItems}
        legacyDescription={order.itemsDescription}
      />
    </div>
  );
}
