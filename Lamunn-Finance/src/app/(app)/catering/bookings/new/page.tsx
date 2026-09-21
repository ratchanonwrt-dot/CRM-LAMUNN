import { requireSectionPage } from "@/lib/permissions";
import NewBookingForm from "@/components/catering/NewBookingForm";

export default async function NewBookingPage() {
  await requireSectionPage("CATERING", "edit");

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">จองจัดเลี้ยงใหม่</h1>
      <NewBookingForm />
    </div>
  );
}
