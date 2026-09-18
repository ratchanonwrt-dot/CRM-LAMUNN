/**
 * ดึงยอดจ่ายคนไลฟ์ที่แอดมินเว็บ Live อนุมัติแล้ว (server-side เท่านั้น — กุญแจลับไม่ออกไปหน้าเบราว์เซอร์)
 * env: LIVE_API_URL (เช่น https://lamunn-live.vercel.app), PAYOUT_SHARED_SECRET (ต้องตรงกับฝั่ง Live)
 */
export interface LivePayout {
  id: string;
  date: string; // YYYY-MM-DD
  streamerName: string;
  nickname: string | null;
  hrEmployeeId: string | null;
  payeeName: string;
  bankName: string | null;
  bankAccountNo: string | null;
  hours: number;
  sales: number;
  shiftCount: number;
  amount: number;
  note: string | null;
  status: "APPROVED" | "PAID";
  approvedBy: string | null;
  approvedAt: string;
  paidAt: string | null;
  paidBy: string | null;
  paidRef: string | null;
  stale: boolean; // ยอดในระบบ Live เปลี่ยนหลังอนุมัติ — รอแอดมิน Live อนุมัติใหม่
}

function base(): { url: string; key: string } | null {
  const url = (process.env.LIVE_API_URL ?? "https://lamunn-live.vercel.app").replace(/\/$/, "");
  const key = process.env.PAYOUT_SHARED_SECRET;
  return key ? { url, key } : null;
}

export async function fetchLivePayouts(from: string, to: string, status: "ALL" | "APPROVED" | "PAID" = "ALL"): Promise<{ rows: LivePayout[]; error: string | null }> {
  const b = base();
  if (!b) return { rows: [], error: "ยังไม่ได้ตั้งค่า PAYOUT_SHARED_SECRET ในเว็บ Finance" };
  try {
    const res = await fetch(`${b.url}/api/payouts/export?from=${from}&to=${to}&status=${status}`, { headers: { "x-payout-key": b.key }, cache: "no-store" });
    if (!res.ok) return { rows: [], error: `เว็บ Live ตอบกลับ ${res.status}${res.status === 401 ? " (กุญแจลับไม่ตรงกัน)" : ""}` };
    const body = await res.json();
    return { rows: body.rows ?? [], error: null };
  } catch (e) {
    return { rows: [], error: `ติดต่อเว็บ Live ไม่ได้: ${(e as Error).message}` };
  }
}

export async function markLivePayoutPaid(id: string, paid: boolean, paidBy: string | null, paidRef: string | null): Promise<{ ok: boolean; error?: string }> {
  const b = base();
  if (!b) return { ok: false, error: "ยังไม่ได้ตั้งค่า PAYOUT_SHARED_SECRET ในเว็บ Finance" };
  try {
    const res = await fetch(`${b.url}/api/payouts/${encodeURIComponent(id)}/paid`, {
      method: "POST",
      headers: { "x-payout-key": b.key, "content-type": "application/json" },
      body: JSON.stringify({ paid, paidBy, paidRef }),
      cache: "no-store",
    });
    const body = await res.json().catch(() => ({}));
    return res.ok ? { ok: true } : { ok: false, error: body.error ?? `เว็บ Live ตอบกลับ ${res.status}` };
  } catch (e) {
    return { ok: false, error: `ติดต่อเว็บ Live ไม่ได้: ${(e as Error).message}` };
  }
}
