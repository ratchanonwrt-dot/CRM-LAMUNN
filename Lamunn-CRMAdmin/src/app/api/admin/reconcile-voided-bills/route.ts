import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/requireStaff";
import { reconcileVoidedBills, syncBranchesFromPos } from "@lamunn/db";

// Manual trigger for SUPER_ADMIN: re-checks recent EARN transactions against the
// POS's own bill status (reverses points for bills voided after the scan) and syncs
// branch open/close state from the POS's own branch list. Also runs automatically
// once a day via Vercel Cron (see Lamunn-CRM/vercel.json) — this endpoint is for
// on-demand checks.
export async function POST() {
  const staff = await requireStaff(["SUPER_ADMIN", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const [voidedBills, branches] = await Promise.all([reconcileVoidedBills(), syncBranchesFromPos()]);
  return NextResponse.json({ ok: true, voidedBills, branches });
}
