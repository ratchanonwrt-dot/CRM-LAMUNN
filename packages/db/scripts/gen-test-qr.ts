import { buildSignedQrContent } from "../src/qr";

const secret = process.env.POS_QR_SECRET ?? "";
const content = buildSignedQrContent(
  { scanBaseUrl: "http://localhost:3000/scan", branchCode: "PARAGON", receiptNo: `TEST-VERIFY-${Date.now()}`, amount: "100.00" },
  secret
);
console.log(content);
