import { prisma } from "@lamunn/db-finance";

function toDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function dateRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  for (let d = toDateOnly(start); d.getTime() <= toDateOnly(end).getTime(); d = new Date(d.getTime() + 86400000)) {
    days.push(d);
  }
  return days;
}

/**
 * ให้แถว CateringBookingDay ตรงกับช่วงวันที่ของงาน (eventDate..eventEndDate) เสมอ — เพิ่มแถววันใหม่
 * ที่ยังไม่มี (ไม่แตะแถวเดิมที่มีจำนวนเสิร์ฟ/โน้ตกรอกไว้แล้ว) และลบแถววันที่หลุดช่วงออกไปเมื่อแก้ไขวันจัดงาน
 * เรียกทั้งตอนสร้างและตอนแก้ไขงาน — งานวันเดียว (eventEndDate ว่าง/เท่ากับ eventDate) จะไม่มีแถวเลย
 */
export async function syncCateringBookingDays(bookingId: string, eventDate: Date, eventEndDate: Date | null) {
  const end = eventEndDate ?? eventDate;
  if (toDateOnly(end).getTime() <= toDateOnly(eventDate).getTime()) {
    await prisma.cateringBookingDay.deleteMany({ where: { bookingId } });
    return;
  }

  const wanted = dateRange(eventDate, end);
  const wantedKeys = new Set(wanted.map((d) => d.toISOString().slice(0, 10)));
  const existing = await prisma.cateringBookingDay.findMany({ where: { bookingId } });
  const existingKeys = new Set(existing.map((d) => d.date.toISOString().slice(0, 10)));

  const toCreate = wanted.filter((d) => !existingKeys.has(d.toISOString().slice(0, 10)));
  const toDeleteIds = existing.filter((d) => !wantedKeys.has(d.date.toISOString().slice(0, 10))).map((d) => d.id);

  await Promise.all([
    ...toCreate.map((date) => prisma.cateringBookingDay.create({ data: { bookingId, date } })),
    ...(toDeleteIds.length ? [prisma.cateringBookingDay.deleteMany({ where: { id: { in: toDeleteIds } } })] : []),
  ]);
}
