import { NextResponse } from "next/server";
import { prisma } from "@lamunn/db";

export async function GET() {
  try {
    const branch = await prisma.branch.findFirst();
    const custCount = await prisma.customer.count();
    return NextResponse.json({ ok: true, branch: branch?.code, custCount });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e), stack: e instanceof Error ? e.stack : undefined },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const branch = await tx.branch.findFirst();
      const count = await tx.customer.count();
      return { branch: branch?.code, count };
    });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e), stack: e instanceof Error ? e.stack : undefined },
      { status: 500 }
    );
  }
}
