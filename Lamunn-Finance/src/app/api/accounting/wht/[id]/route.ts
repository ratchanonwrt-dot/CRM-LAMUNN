import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";

/** ยกเลิกหนังสือรับรองหัก ณ ที่จ่าย — ไม่ลบทิ้ง เพราะเลขที่ต้องรันต่อเนื่องและตรวจย้อนหลังได้ */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("ACCOUNTING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { action } = await req.json();
  if (action !== "void") return NextResponse.json({ error: "action ต้องเป็น void" }, { status: 400 });

  const cert = await prisma.accWhtCertificate.update({ where: { id: params.id }, data: { voided: true } });
  return NextResponse.json({ cert });
}
