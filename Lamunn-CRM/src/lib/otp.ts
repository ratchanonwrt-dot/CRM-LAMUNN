import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@lamunn/db";

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES ?? 5);
const MAX_ATTEMPTS = 5;
const THAIBULKSMS_BASE = "https://otp.thaibulksms.com/v1/otp";

function generateNumericCode(length = 6) {
  const max = 10 ** length;
  const n = crypto.randomInt(0, max);
  return n.toString().padStart(length, "0");
}

function thaibulksmsConfigured() {
  return Boolean(process.env.SMS_API_KEY && process.env.SMS_API_SECRET);
}

async function thaibulksmsRequest(msisdn: string): Promise<{ token: string }> {
  const res = await fetch(`${THAIBULKSMS_BASE}/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: process.env.SMS_API_KEY, secret: process.env.SMS_API_SECRET, msisdn }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? "ส่ง OTP ไม่สำเร็จ");
  return { token: data.data.token };
}

async function thaibulksmsVerify(token: string, pin: string): Promise<{ ok: boolean; reason?: string }> {
  const res = await fetch(`${THAIBULKSMS_BASE}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: process.env.SMS_API_KEY, secret: process.env.SMS_API_SECRET, token, pin }),
  });
  const data = await res.json();
  if (res.ok) return { ok: true };

  const message: string = data?.error?.message ?? "";
  if (message.toLowerCase().includes("expire")) return { ok: false, reason: "EXPIRED" };
  if (message.toLowerCase().includes("invalid")) return { ok: false, reason: "INCORRECT" };
  return { ok: false, reason: "INCORRECT" };
}

export async function requestOtp(phone: string) {
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  if (thaibulksmsConfigured()) {
    const { token } = await thaibulksmsRequest(phone);
    await prisma.otpCode.create({ data: { phone, token, expiresAt } });
    return { expiresAt };
  }

  // Dev/local fallback: no SMS_API_KEY/SMS_API_SECRET configured — generate
  // our own code, log it to the server console instead of sending a real SMS.
  const code = generateNumericCode();
  const codeHash = await bcrypt.hash(code, 10);
  await prisma.otpCode.create({ data: { phone, codeHash, expiresAt } });
  console.warn(`[otp] SMS_API_KEY not set — OTP for ${phone} is: ${code}`);
  return { expiresAt };
}

export async function verifyOtp(phone: string, code: string): Promise<{ ok: boolean; reason?: string }> {
  const record = await prisma.otpCode.findFirst({
    where: { phone, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { ok: false, reason: "NOT_FOUND" };
  if (record.expiresAt < new Date()) return { ok: false, reason: "EXPIRED" };
  if (record.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "TOO_MANY_ATTEMPTS" };

  if (record.token) {
    const result = await thaibulksmsVerify(record.token, code);
    if (!result.ok) {
      await prisma.otpCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
      return result;
    }
    await prisma.otpCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
    return { ok: true };
  }

  const match = record.codeHash ? await bcrypt.compare(code, record.codeHash) : false;
  if (!match) {
    await prisma.otpCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, reason: "INCORRECT" };
  }

  await prisma.otpCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
  return { ok: true };
}
