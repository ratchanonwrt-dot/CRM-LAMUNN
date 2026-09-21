"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { processTaxInvoiceRequest } from "@/lib/processRequest";

export async function retryRequest(id: string) {
  const record = await prisma.taxInvoiceRequest.findUnique({ where: { id } });
  if (!record) return;
  await processTaxInvoiceRequest(record);
  revalidatePath("/admin");
}
