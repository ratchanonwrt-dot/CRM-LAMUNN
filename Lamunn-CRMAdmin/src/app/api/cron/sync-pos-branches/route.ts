import { NextRequest, NextResponse } from "next/server";
import { syncBranchesFromPos } from "@lamunn/db";

export const dynamic = "force-dynamic";

/** Daily guaranteed pass of the POS → CRM branch sync (see vercel.json crons);
 * admin pages also run it opportunistically on load. */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await syncBranchesFromPos()) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message.split("\n")[0] : String(e) }, { status: 500 });
  }
}
