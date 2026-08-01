import { buildSignedQrContent } from "../src/qr";
const secret = process.env.POS_QR_SECRET ?? "";
const content = buildSignedQrContent(
  { scanBaseUrl: "http://localhost:3000/scan", branchCode: "BANGKAPI", receiptNo: "BANGKAPI-260729-220449670", amount: "278.00" },
  secret
);
console.log(content);
