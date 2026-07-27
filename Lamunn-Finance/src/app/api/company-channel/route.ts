import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireStaff } from "@/lib/requireStaff";
import { parseDateOnly } from "@/lib/dates";

export async function GET(req: NextRequest) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });

  const row = await prisma.companyChannelDaily.findUnique({ where: { date: parseDateOnly(date) } });
  return NextResponse.json({ row });
}

export async function POST(req: NextRequest) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { date, tiktok, fbLine, pickup, catering, depositGrab, depositLineman, depositStorefront, depositEcom, note } = body;
  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });

  const num = (v: unknown) => (v === "" || v === undefined || v === null ? 0 : Number(v));
  const numOrNull = (v: unknown) => (v === "" || v === undefined || v === null ? null : Number(v));

  // Only touch fields the caller actually sent — lets a single-cell inline edit
  // (e.g. just `tiktok`) save without wiping out the other channels' values.
  const updateData: Record<string, unknown> = {};
  if (tiktok !== undefined) updateData.tiktok = num(tiktok);
  if (fbLine !== undefined) updateData.fbLine = num(fbLine);
  if (pickup !== undefined) updateData.pickup = num(pickup);
  if (catering !== undefined) updateData.catering = num(catering);
  if (depositGrab !== undefined) updateData.depositGrab = numOrNull(depositGrab);
  if (depositLineman !== undefined) updateData.depositLineman = numOrNull(depositLineman);
  if (depositStorefront !== undefined) updateData.depositStorefront = numOrNull(depositStorefront);
  if (depositEcom !== undefined) updateData.depositEcom = numOrNull(depositEcom);
  if (note !== undefined) updateData.note = note || null;

  const createData = {
    tiktok: num(tiktok),
    fbLine: num(fbLine),
    pickup: num(pickup),
    catering: num(catering),
    depositGrab: numOrNull(depositGrab),
    depositLineman: numOrNull(depositLineman),
    depositStorefront: numOrNull(depositStorefront),
    depositEcom: numOrNull(depositEcom),
    note: note || null,
  };

  const row = await prisma.companyChannelDaily.upsert({
    where: { date: parseDateOnly(date) },
    update: updateData,
    create: { date: parseDateOnly(date), ...createData },
  });

  return NextResponse.json({ row });
}
