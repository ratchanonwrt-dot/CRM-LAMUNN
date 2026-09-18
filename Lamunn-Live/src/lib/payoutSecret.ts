import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

/**
 * กุญแจลับร่วมระหว่างเว็บ Live กับเว็บ Finance (env PAYOUT_SHARED_SECRET ต้องตั้งให้ตรงกันทั้งสองโปรเจกต์)
 * Finance ส่งมาใน header `x-payout-key` — ถ้าไม่ตั้ง env ไว้ API ฝั่งนี้จะปิดตาย
 */
export function checkPayoutKey(req: NextRequest): boolean {
  const secret = process.env.PAYOUT_SHARED_SECRET;
  const given = req.headers.get("x-payout-key");
  if (!secret || !given) return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}
