import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { revalidateSettings } from "@/lib/settings";
import { logActivity } from "@/lib/activityLog";

export async function GET() {
  const staff = await requireSectionApi("SETTINGS", "view");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = await prisma.setting.findMany();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const staff = await requireSectionApi("SETTINGS", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const entries = Object.entries(body) as [string, string][];

  await Promise.all(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );

  // ค่าตั้งค่าถูกแคชไว้ให้ทุกหน้าใช้ร่วมกัน — ล้างทิ้งทันทีที่บันทึก ไม่งั้นหน้าอื่นจะยังเห็นค่าเดิม
  revalidateSettings();

  await logActivity({
    staffId: staff.staffId,
    staffName: staff.staffName,
    action: "UPDATE",
    entity: "Setting",
    summary: `แก้ไขค่าตั้งค่าระบบ — ${entries.map(([k]) => k).join(", ")}`,
  });

  return NextResponse.json({ ok: true });
}
