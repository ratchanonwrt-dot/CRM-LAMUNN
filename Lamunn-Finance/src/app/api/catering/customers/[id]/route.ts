import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { logActivity } from "@/lib/activityLog";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("CATERING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, phone } = body;

  const trimmedName = typeof name === "string" ? name.trim() : undefined;
  if (trimmedName !== undefined && !trimmedName) {
    return NextResponse.json({ error: "กรุณากรอกชื่อลูกค้า" }, { status: 400 });
  }

  const trimmedPhone = typeof phone === "string" ? phone.trim() : undefined;
  if (trimmedPhone !== undefined) {
    if (!trimmedPhone) return NextResponse.json({ error: "กรุณากรอกเบอร์โทร" }, { status: 400 });
    // เบอร์มือถือไทยจริงมีอย่างน้อย 9 หลัก — กันเคสกรอกไม่ครบแบบ "08" ที่เจอจริง (ลูกค้า "Deer" เบอร์ "08")
    if (trimmedPhone.replace(/\D/g, "").length < 9) {
      return NextResponse.json({ error: "เบอร์โทรไม่ครบ (ต้องมีอย่างน้อย 9 หลัก)" }, { status: 400 });
    }
  }

  const existing = await prisma.customer.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  let customer;
  try {
    customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        ...(trimmedName !== undefined ? { name: trimmedName } : {}),
        ...(trimmedPhone !== undefined ? { phone: trimmedPhone } : {}),
      },
    });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && e.code === "P2002") {
      return NextResponse.json({ error: "เบอร์นี้มีลูกค้าคนอื่นใช้อยู่แล้ว" }, { status: 400 });
    }
    throw e;
  }

  if (existing.name !== customer.name || existing.phone !== customer.phone) {
    await logActivity({
      staffId: staff.staffId,
      staffName: staff.staffName,
      action: "UPDATE",
      entity: "Customer",
      summary: `แก้ไขข้อมูลลูกค้า — ${existing.name} (${existing.phone}) → ${customer.name} (${customer.phone})`,
    });
  }

  return NextResponse.json({ customer });
}
