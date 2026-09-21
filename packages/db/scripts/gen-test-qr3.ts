import { buildSignedQrContent } from "../src/qr";
const secret = process.env.POS_QR_SECRET ?? "";
const content = buildSignedQrContent(
  { scanBaseUrl: "http://localhost:3000/scan", branchCode: "CLOUD11 4", receiptNo: "CLOUD11 4-260806-185314637", amount: "139.00" },
  secret
);
console.log(content);
