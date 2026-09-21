import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@lamunn/db-finance";
import { SALES_DATA_CACHE_TAG } from "@/lib/reportsCalc";
import { requireSectionApi } from "@/lib/permissions";
import { parseDateOnly } from "@/lib/dates";

export async function GET(req: NextRequest) {
  const staff = await requireSectionApi("MONTHLY", "view");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });

  const row = await prisma.companyChannelDaily.findUnique({ where: { date: parseDateOnly(date) } });
  return NextResponse.json({ row });
}

export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("MONTHLY", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    date,
    tiktok,
    fbLine,
    pickup,
    catering,
    depositGrab,
    depositLineman,
    depositStorefront,
    depositEcom,
    note,
    overrideTiktok,
    overrideFbLine,
    overridePickup,
    overrideCatering,
  } = body;
  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });

  const num = (v: unknown) => (v === "" || v === undefined || v === null ? 0 : Number(v));
  const numOrNull = (v: unknown) => (v === "" || v === undefined || v === null ? null : Number(v));

  // tiktok/fbLine/pickup/catering are only written (and flagged as a manual override) when
  // the caller explicitly signals it — either a single-cell inline edit (always deliberate)
  // or the full form detecting the submitted value differs from what was loaded — so the
  // IMS sync doesn't get clobbered by resubmitting an untouched auto-synced value.
  const updateData: Record<string, unknown> = {};
  if (overrideTiktok) {
    updateData.tiktok = num(tiktok);
    updateData.tiktokOverride = true;
  }
  if (overrideFbLine) {
    updateData.fbLine = num(fbLine);
    updateData.fbLineOverride = true;
  }
  if (overridePickup) {
    updateData.pickup = num(pickup);
    updateData.pickupOverride = true;
  }
  if (overrideCatering) {
    updateData.catering = num(catering);
    updateData.cateringOverride = true;
  }
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
    tiktokOverride: Boolean(overrideTiktok),
    fbLineOverride: Boolean(overrideFbLine),
    pickupOverride: Boolean(overridePickup),
    cateringOverride: Boolean(overrideCatering),
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

  // ยอด E-Commerce/หมายเหตุรายวันเป็นส่วนหนึ่งของข้อมูลยอดขายที่หน้ารายงานแคชไว้
  revalidateTag(SALES_DATA_CACHE_TAG);
  return NextResponse.json({ row });
}
