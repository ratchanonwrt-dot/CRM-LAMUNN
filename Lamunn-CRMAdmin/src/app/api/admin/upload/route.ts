import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireStaff } from "@/lib/requireStaff";

const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function POST(req: NextRequest) {
  const staff = await requireStaff(["SUPER_ADMIN", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "ไม่พบไฟล์รูปภาพ" }, { status: 400 });

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "รองรับเฉพาะไฟล์ PNG, JPG, WEBP หรือ GIF" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "ไฟล์ต้องมีขนาดไม่เกิน 4MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const key = `${crypto.randomUUID()}.${ext}`;

  const blob = await put(key, file, { access: "public" });
  return NextResponse.json({ ok: true, url: blob.url });
}
