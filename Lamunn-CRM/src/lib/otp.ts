import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@lamunn/db";

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES ?? 5);
const MAX_ATTEMPTS = 5;

function generateNumericCode(length = 6) {
  const max = 10 ** length;
  const n = crypto.randomInt(0, max);
  return n.toString().padStart(length, "0");
}

/**
 * Sends an OTP SMS. This is the single place to wire up a real provider
 * (Thsms, Twilio, AWS SNS, etc.) — swap the body for an HTTP call using
 * process.env.SMS_PROVIDER_API_KEY. Left as a console.log stub so the rest
 * of the login flow can be developed/tested without a live SMS account.
 */
async function sendOtpSms(phone: string, code: string) {
  if (!process.env.SMS_PROVIDER_API_KEY) {
    console.warn(`[otp] SMS_PROVIDER_API_KEY not set — OTP for ${phone} is: ${code}`);
    return;
  }
  // TODO: replace with a real provider call, e.g.:
  // await fetch("https://api.your-sms-provider.com/send", {
  //   method: "POST",
  //   headers: { Authorization: `Bearer ${process.env.SMS_PROVIDER_API_KEY}` },
  //   body: JSON.stringify({ to: phone, sender: process.env.SMS_PROVIDER_SENDER_NAME, text: `รหัส OTP ของคุณคือ ${code}` }),
  // });
  console.warn(`[otp] TODO: send real SMS to ${phone}: ${code}`);
}

export async function requestOtp(phone: string) {
  const code = generateNumericCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: { phone, codeHash, expiresAt },
  });

  await sendOtpSms(phone, code);
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

  const match = await bcrypt.compare(code, record.codeHash);
  if (!match) {
    await prisma.otpCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, reason: "INCORRECT" };
  }

  await prisma.otpCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
  return { ok: true };
}
