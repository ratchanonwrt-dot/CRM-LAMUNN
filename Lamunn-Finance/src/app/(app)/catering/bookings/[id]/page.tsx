import { notFound } from "next/navigation";
import { prisma } from "@lamunn/db-finance";
import { requireSectionPage } from "@/lib/permissions";
import BookingEditForm from "@/components/catering/BookingEditForm";
import BookingStaffPanel from "@/components/catering/BookingStaffPanel";
import BookingBoothPanel from "@/components/catering/BookingBoothPanel";
import BookingItemsPanel from "@/components/catering/BookingItemsPanel";
import BookingDaysPanel from "@/components/catering/BookingDaysPanel";
import DeleteBookingButton from "@/components/catering/DeleteBookingButton";
import EditableBookingCustomer from "@/components/catering/EditableBookingCustomer";
import { formatThaiDate, customerSourceLabel } from "@/lib/format";

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  await requireSectionPage("CATERING");

  const [booking, menuItems, minSettings] = await Promise.all([
    prisma.cateringBooking.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        staffAssignments: { include: { staff: { select: { id: true, name: true } } } },
        items: { orderBy: { sortOrder: "asc" } },
        days: { orderBy: { date: "asc" } },
      },
    }),
    prisma.cateringMenuItem.findMany({ where: { isActive: true, category: { in: ["MENU", "SERVICE"] } }, orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
    prisma.setting.findMany({ where: { key: { in: ["cateringMinWithBooth", "cateringMinNoBooth"] } } }),
  ]);

  if (!booking) notFound();

  const minMap = Object.fromEntries(minSettings.map((r) => [r.key, r.value]));
  const minimumOrder = booking.needsBooth ? Number(minMap.cateringMinWithBooth ?? 10000) : Number(minMap.cateringMinNoBooth ?? 6000);

  const isMultiDay = booking.eventEndDate && booking.eventEndDate.getTime() > booking.eventDate.getTime();
  const dateLabel = isMultiDay
    ? `${formatThaiDate(booking.eventDate)} – ${formatThaiDate(booking.eventEndDate!)}`
    : formatThaiDate(booking.eventDate);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <EditableBookingCustomer customerId={booking.customer.id} name={booking.customer.name} phone={booking.customer.phone} size="lg" />
          <p className="text-sm text-gray-500">
            {dateLabel}
            {booking.customer.source ? ` · ${customerSourceLabel[booking.customer.source] ?? booking.customer.source}` : ""}
          </p>
        </div>
        <DeleteBookingButton id={booking.id} redirectAfter />
      </div>

      <BookingEditForm
        key={booking.totalAmount}
        booking={{
          ...booking,
          eventDate: booking.eventDate.toISOString(),
          eventEndDate: booking.eventEndDate?.toISOString() ?? null,
          depositPaidAt: booking.depositPaidAt?.toISOString() ?? null,
          balancePaidAt: booking.balancePaidAt?.toISOString() ?? null,
        }}
        hasItems={booking.items.length > 0}
      />

      <BookingDaysPanel
        bookingId={booking.id}
        days={booking.days.map((d) => ({ ...d, date: d.date.toISOString() }))}
      />

      <BookingItemsPanel bookingId={booking.id} items={booking.items} menuItems={menuItems} minimumOrder={minimumOrder} />

      <BookingStaffPanel bookingId={booking.id} assignments={booking.staffAssignments} />

      <BookingBoothPanel bookingId={booking.id} needsBooth={booking.needsBooth} specialRequest={booking.specialRequest} />
    </div>
  );
}
