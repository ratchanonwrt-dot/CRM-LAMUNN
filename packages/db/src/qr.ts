import crypto from "crypto";

/**
 * POS QR spec
 * -----------
 * The POS prints a QR code at the bottom of every receipt. Scanning it opens:
 *
 *   https://<domain>/scan?b=<branchCode>&r=<receiptNo>&a=<amount>&t=<timestamp>&s=<signature>
 *
 *   b  branch code, must match Branch.code in the database (e.g. "BKK01")
 *   r  POS receipt number, unique per branch per day/shift (whatever the POS already prints)
 *   a  sale amount in THB, up to 2 decimals, no thousands separator (e.g. "350.50")
 *   t  sale timestamp, UNIX seconds
 *   s  HMAC-SHA256 signature (see below), base64url, OPTIONAL until the POS side signs
 *
 * Signature (recommended, prevents forged/edited QR codes):
 *   message   = `${b}|${r}|${a}|${t}`
 *   signature = base64url( HMAC_SHA256(POS_QR_SECRET, message) )
 *
 * The POS_QR_SECRET must be shared out-of-band with whoever configures the POS's QR
 * template and never exposed client-side. Until the POS vendor implements signing,
 * `s` may be omitted — see verifyQrPayload() for the unsigned fallback policy.
 */

export interface ParsedQrPayload {
  branchCode: string;
  receiptNo: string;
  amount: number;
  timestampSec: number;
  signature: string | null;
  raw: string;
}

export type QrVerifyResult =
  | { ok: true; signed: boolean; payload: ParsedQrPayload }
  | { ok: false; reason: "MALFORMED" | "INVALID_SIGNATURE" | "EXPIRED"; payload: ParsedQrPayload | null };

export function parseQrPayload(rawUrlOrQuery: string): ParsedQrPayload | null {
  try {
    // Accept either a full URL or a bare query string.
    const query = rawUrlOrQuery.includes("?")
      ? rawUrlOrQuery.slice(rawUrlOrQuery.indexOf("?") + 1)
      : rawUrlOrQuery;
    const params = new URLSearchParams(query);

    const branchCode = params.get("b");
    const receiptNo = params.get("r");
    const amountStr = params.get("a");
    const timestampStr = params.get("t");
    const signature = params.get("s");

    if (!branchCode || !receiptNo || !amountStr || !timestampStr) return null;

    const amount = Number(amountStr);
    const timestampSec = Number(timestampStr);
    if (!Number.isFinite(amount) || amount < 0) return null;
    if (!Number.isFinite(timestampSec) || timestampSec <= 0) return null;

    return {
      branchCode: branchCode.trim().toUpperCase(),
      receiptNo: receiptNo.trim(),
      amount,
      timestampSec,
      signature: signature || null,
      raw: rawUrlOrQuery,
    };
  } catch {
    return null;
  }
}

function computeSignature(payload: Pick<ParsedQrPayload, "branchCode" | "receiptNo" | "amount" | "timestampSec">, secret: string) {
  const message = `${payload.branchCode}|${payload.receiptNo}|${payload.amount}|${payload.timestampSec}`;
  return crypto.createHmac("sha256", secret).update(message).digest("base64url");
}

/**
 * Verifies a raw QR string end to end: parses it, checks the HMAC signature if present,
 * and enforces the expiry window. Signature is optional (see POS QR spec above) — callers
 * decide policy for unsigned scans (e.g. cap the auto-approved amount) using `signed`.
 */
export function verifyQrPayload(
  rawUrlOrQuery: string,
  opts: { secret: string; validHours: number }
): QrVerifyResult {
  const payload = parseQrPayload(rawUrlOrQuery);
  if (!payload) return { ok: false, reason: "MALFORMED", payload: null };

  const ageHours = (Date.now() / 1000 - payload.timestampSec) / 3600;
  if (ageHours < -1 || ageHours > opts.validHours) {
    // allow up to 1 hour of clock skew in the future
    return { ok: false, reason: "EXPIRED", payload };
  }

  if (payload.signature) {
    const expected = computeSignature(payload, opts.secret);
    const validSig =
      expected.length === payload.signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(payload.signature));
    if (!validSig) return { ok: false, reason: "INVALID_SIGNATURE", payload };
    return { ok: true, signed: true, payload };
  }

  // No signature present — accepted as "unsigned"; caller applies its own risk policy.
  return { ok: true, signed: false, payload };
}

/** Helper for generating a matching QR content string, e.g. for testing or for a POS
 * simulator page. Not used by the scan flow itself. */
export function buildSignedQrContent(
  base: { scanBaseUrl: string; branchCode: string; receiptNo: string; amount: number; timestampSec?: number },
  secret: string
) {
  const timestampSec = base.timestampSec ?? Math.floor(Date.now() / 1000);
  const payload = { branchCode: base.branchCode, receiptNo: base.receiptNo, amount: base.amount, timestampSec };
  const signature = computeSignature(payload, secret);
  const params = new URLSearchParams({
    b: payload.branchCode,
    r: payload.receiptNo,
    a: String(payload.amount),
    t: String(payload.timestampSec),
    s: signature,
  });
  return `${base.scanBaseUrl}?${params.toString()}`;
}
