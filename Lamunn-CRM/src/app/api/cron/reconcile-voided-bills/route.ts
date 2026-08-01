import { NextRequest, NextResponse } from "next/server";
import { reconcileVoidedBills, syncBranchesFromPos } from "@lamunn/db";

// Runs once a day via Vercel Cron (see vercel.json). Vercel signs cron requests with
// this header automatically; CRON_SECRET is the standard env var name Vercel looks for.
// Bundles both POS-reconciliation jobs into one run to stay within the Hobby plan's cron limits.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const [voidedBills, branches] = await Promise.all([reconcileVoidedBills(), syncBranchesFromPos()]);
  return NextResponse.json({ ok: true, voidedBills, branches });
}
