import { cookies } from "next/headers";

/** คุกกี้จำเบอร์โทรของคนไลฟ์บนเว็บจอง (ไม่ใส่เบอร์ใน URL) */
export const ME_COOKIE = "lb_me_phone";

export function cleanPhone(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const digits = v.replace(/[^\d+]/g, "");
  return digits.length >= 9 && digits.length <= 15 ? digits : null;
}

/** เบอร์ที่จำไว้ในคุกกี้ (server component / route handler) */
export function phoneFromCookies(): string | null {
  return cleanPhone(cookies().get(ME_COOKIE)?.value ?? null);
}

export function maskPhone(p: string): string {
  return p.length >= 7 ? `${p.slice(0, 3)}-xxx-${p.slice(-4)}` : p;
}
