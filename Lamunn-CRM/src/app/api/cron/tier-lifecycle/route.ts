import { NextRequest, NextResponse } from "next/server";
import { runTierLifecycle, grantBirthdayCoupons } from "@lamunn/db";

// Runs once a day via Vercel Cron (see vercel.json). Each customer is only acted
// on if their own anniversary/grant date is actually due — see tierLifecycle.ts.
// Birthday-coupon granting is folded in here too (rather than its own cron
// entry) to stay within Vercel's cron-job count limit on this project's plan —
// grantBirthdayCoupons() dedupes per customer per year on its own, so it's
// unrelated to (and safe to run alongside) the tier checks below.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const [tierResult, birthdayResult] = await Promise.all([runTierLifecycle(), grantBirthdayCoupons()]);
  return NextResponse.json({ ok: true, ...tierResult, birthdayCouponsGranted: birthdayResult.granted });
}
