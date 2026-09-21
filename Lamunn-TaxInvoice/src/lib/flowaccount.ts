/**
 * Flow Account integration — issues the actual ใบกำกับภาษี via Flow Account's Open API.
 *
 * IMPORTANT: the exact endpoint paths and request/response shape below are a
 * best-effort placeholder based on Flow Account's publicly documented Open API
 * pattern (OAuth2 client-credentials + a document-creation endpoint scoped by
 * AccountID). They have NOT been confirmed against a live account yet. Once the
 * real API key/AccountID and current docs (https://developer.flowaccount.com) are
 * available, verify and adjust:
 *   - TOKEN_PATH / DOCUMENT_PATH below
 *   - the field names inside buildDocumentPayload()
 *   - how the response maps to `docId` / `pdfUrl`
 * Everything else in this project (DB, email, form) is independent of this file.
 */

const API_BASE_URL = process.env.FLOWACCOUNT_API_BASE_URL ?? "https://api-openapi.flowaccount.com/v1";
const API_KEY = process.env.FLOWACCOUNT_API_KEY ?? "";
const ACCOUNT_ID = process.env.FLOWACCOUNT_ACCOUNT_ID ?? "";

// TODO verify against Flow Account Open API docs.
const TOKEN_PATH = "/oauth2/token";
const DOCUMENT_PATH = "/Documents";

export class FlowAccountNotConfiguredError extends Error {
  constructor() {
    super("FLOWACCOUNT_API_KEY is not set — skipping Flow Account call");
    this.name = "FlowAccountNotConfiguredError";
  }
}

export interface TaxInvoiceInput {
  receiptNo: string;
  amount: number;
  saleDate: Date;
  customerType: string; // "INDIVIDUAL" | "COMPANY"
  fullName: string;
  taxId: string;
  branchTag: string | null;
  address: string;
  email: string;
  phone: string | null;
}

export interface TaxInvoiceResult {
  docId: string;
  pdfUrl: string | null;
}

function assertConfigured() {
  if (!API_KEY || !ACCOUNT_ID) throw new FlowAccountNotConfiguredError();
}

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${API_BASE_URL}${TOKEN_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: API_KEY, accountId: ACCOUNT_ID }),
  });
  if (!res.ok) {
    throw new Error(`Flow Account auth failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  const data = (await res.json()) as { accessToken?: string; access_token?: string };
  const token = data.accessToken ?? data.access_token;
  if (!token) throw new Error("Flow Account auth response missing access token");
  return token;
}

function buildDocumentPayload(input: TaxInvoiceInput) {
  return {
    accountId: ACCOUNT_ID,
    documentType: "TaxInvoice",
    documentDate: input.saleDate.toISOString().slice(0, 10),
    reference: input.receiptNo,
    customer: {
      name: input.fullName,
      taxId: input.taxId,
      branchTag: input.branchTag ?? "สำนักงานใหญ่",
      address: input.address,
      email: input.email,
      phone: input.phone ?? undefined,
    },
    items: [
      {
        description: `สินค้า/บริการ ตามใบเสร็จเลขที่ ${input.receiptNo}`,
        quantity: 1,
        unitPrice: input.amount,
      },
    ],
  };
}

/** Creates the tax invoice document in Flow Account and returns its id + PDF link.
 * Throws FlowAccountNotConfiguredError if no API key/AccountID is set yet — callers
 * should catch that specifically and fall back to a manual-processing status. */
export async function createTaxInvoiceDocument(input: TaxInvoiceInput): Promise<TaxInvoiceResult> {
  assertConfigured();

  const token = await getAccessToken();
  const res = await fetch(`${API_BASE_URL}${DOCUMENT_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(buildDocumentPayload(input)),
  });

  if (!res.ok) {
    throw new Error(`Flow Account document creation failed: ${res.status} ${await res.text().catch(() => "")}`);
  }

  const data = (await res.json()) as { id?: string; documentId?: string; pdfUrl?: string; pdfLink?: string };
  const docId = data.id ?? data.documentId;
  if (!docId) throw new Error("Flow Account response missing document id");

  return { docId, pdfUrl: data.pdfUrl ?? data.pdfLink ?? null };
}
