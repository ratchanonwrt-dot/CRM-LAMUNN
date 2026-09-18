import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { requireStaff, EDITOR_ROLES } from "@/lib/requireStaff";
import { optionalText } from "@/lib/validation";

/** PATCH — แก้หมายเหตุของรายการที่อนุมัติแล้ว */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const row = await prisma.dailyPayout.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
  const updated = await prisma.dailyPayout.update({ where: { id: params.id }, data: { note: optionalText(body.note) } });
  return NextResponse.json({ payout: updated });
}

/** DELETE — ยกเลิกการอนุมัติ (ทำได้เฉพาะที่บัญชียังไม่ทำจ่าย) */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const row = await prisma.dailyPayout.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
  if (row.status === "PAID") return NextResponse.json({ error: "บัญชีทำจ่ายรายการนี้แล้ว ยกเลิกไม่ได้ — ให้บัญชีถอนสถานะจ่ายก่อน" }, { status: 400 });
  await prisma.dailyPayout.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
