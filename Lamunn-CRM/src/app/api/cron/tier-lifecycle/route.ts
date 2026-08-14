import { NextRequest, NextResponse } from "next/server";
import { runTierLifecycle } from "@lamunn/db";

// Runs once a day via Vercel Cron (see vercel.json). Each customer is only acted
// on if their own anniversary/grant date is actually due — see tierLifecycle.ts.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await runTierLifecycle();
  return NextResponse.json({ ok: true, ...result });
}
