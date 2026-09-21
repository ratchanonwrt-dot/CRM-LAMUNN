import type { TaxInvoiceRequest } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createTaxInvoiceDocument, FlowAccountNotConfiguredError } from "@/lib/flowaccount";
import { sendTaxInvoiceEmail, sendAcknowledgementEmail } from "@/lib/email";

/** Attempts to issue the Flow Account document (if not already issued) and email the
 * customer, then updates the request's status accordingly. Used both right after a
 * new request is submitted and for admin-triggered retries. */
export async function processTaxInvoiceRequest(record: TaxInvoiceRequest): Promise<void> {
  try {
    let docId = record.flowAccountDocId;
    let pdfUrl = record.flowAccountPdfUrl;

    if (!docId) {
      const result = await createTaxInvoiceDocument({
        receiptNo: record.receiptNo,
        amount: Number(record.amount),
        saleDate: record.saleTimestamp,
        customerType: record.customerType,
        fullName: record.fullName,
        taxId: record.taxId,
        branchTag: record.branchTag,
        address: record.address,
        email: record.email,
        phone: record.phone,
      });
      docId = result.docId;
      pdfUrl = result.pdfUrl;
    }

    await sendTaxInvoiceEmail({
      to: record.email,
      fullName: record.fullName,
      receiptNo: record.receiptNo,
      amount: Number(record.amount),
      pdfUrl,
    });

    await prisma.taxInvoiceRequest.update({
      where: { id: record.id },
      data: { status: "EMAIL_SENT", flowAccountDocId: docId, flowAccountPdfUrl: pdfUrl, emailSentAt: new Date(), errorMessage: null },
    });
  } catch (err) {
    if (err instanceof FlowAccountNotConfiguredError) {
      await sendAcknowledgementEmail({ to: record.email, fullName: record.fullName, receiptNo: record.receiptNo }).catch(() => null);
      await prisma.taxInvoiceRequest.update({ where: { id: record.id }, data: { status: "AWAITING_FLOWACCOUNT_SETUP" } });
    } else {
      const message = err instanceof Error ? err.message : "Unknown error";
      await prisma.taxInvoiceRequest.update({ where: { id: record.id }, data: { status: "FAILED", errorMessage: message } });
    }
  }
}
