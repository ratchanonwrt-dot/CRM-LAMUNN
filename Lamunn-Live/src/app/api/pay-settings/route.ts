import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { requireStaff, EDITOR_ROLES } from "@/lib/requireStaff";
import { getPaySettings } from "@/lib/paySettings";

export async function GET() {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ settings: await getPaySettings() });
}

export async function PATCH(req: NextRequest) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const data: Record<string, number> = {};
  const labels: Record<string, string> = { shippingPct: "% ค่าส่ง", commissionPct: "% คอมมิชชั่น", minHourly: "ขั้นต่ำต่อชั่วโมง" };
  for (const key of ["shippingPct", "commissionPct", "minHourly"] as const) {
    if (body[key] === undefined) continue;
    const n = Number(body[key]);
    if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: `${labels[key]} ต้องเป็นตัวเลข 0 ขึ้นไป` }, { status: 400 });
    if (key !== "minHourly" && n > 100) return NextResponse.json({ error: `${labels[key]} ต้องไม่เกิน 100` }, { status: 400 });
    data[key] = n;
  }
  await getPaySettings();
  const settings = await prisma.paySetting.update({ where: { id: "default" }, data });
  return NextResponse.json({ settings });
}
