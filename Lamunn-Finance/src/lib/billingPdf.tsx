import path from "path";
import React from "react";
import { Document, Page, View, Text as PdfText, StyleSheet, Font, renderToBuffer } from "@react-pdf/renderer";

// react-pdf's text layout engine has a bug where a glyph at either end of a Text node sometimes
// gets silently dropped for this font — confirmed both ends via visual PDF-to-PNG inspection:
// trailing drop ("จำกัด" → "จำกั", "บาท" garbled) and, separately, a leading drop that shows up
// specifically when the string mixes Thai with a Latin word ("ทางร้าน Lamunn..." → "างร้าน Lamunn...").
// Harmless leading/trailing spaces absorb whatever gets clipped instead of the real content —
// every Text in this file goes through this wrapper.
function Text(props: { style?: unknown; wrap?: boolean; fixed?: boolean; children?: React.ReactNode }) {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <PdfText {...(props as any)}>
      {" "}
      {props.children}
      {" "}
    </PdfText>
  );
}

// react-pdf ไม่รองรับฟอนต์ไทยในตัว (default ใช้ Helvetica ซึ่งไม่มี glyph ภาษาไทย) ต้อง register เอง
// ไฟล์ฟอนต์อยู่ที่ src/fonts — ถูก trace เข้า serverless bundle ผ่าน next.config.js (outputFileTracingIncludes)
let fontsRegistered = false;
function ensureFontsRegistered() {
  if (fontsRegistered) return;
  Font.register({
    family: "NotoSansThai",
    fonts: [
      { src: path.join(process.cwd(), "src/fonts/NotoSansThai-Regular.ttf"), fontWeight: "normal" },
      { src: path.join(process.cwd(), "src/fonts/NotoSansThai-Bold.ttf"), fontWeight: "bold" },
    ],
  });
  // react-pdf ใช้กฎ hyphenation ภาษาอังกฤษ (ตัดคำตามพยางค์แบบละติน) กับข้อความทุกภาษาโดย default
  // เพื่อคำนวณจุดตัดบรรทัด — ภาษาไทยไม่มีเว้นวรรคระหว่างคำและไม่ใช้กฎพยางค์แบบละติน ทำให้มันตัดคำไทยผิดตำแหน่ง
  // (คำท้ายๆ ในบรรทัดหายไปเป็นประจำ) ปิดการตัดคำอัตโนมัติไปเลย ให้ถือทั้งก้อนข้อความเป็นหน่วยเดียว
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

const styles = StyleSheet.create({
  page: { fontFamily: "NotoSansThai", fontSize: 10, paddingTop: 56, paddingBottom: 56, paddingHorizontal: 52, color: "#111827" },
  letterhead: { marginBottom: 26 },
  letterheadName: { fontSize: 11, fontWeight: "bold" },
  letterheadMeta: { fontSize: 8, color: "#6b7280", marginTop: 3 },
  title: { fontSize: 14, fontWeight: "bold", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 10, textAlign: "center", marginBottom: 24 },
  paragraph: { fontSize: 10, lineHeight: 1.8, marginBottom: 26 },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 8,
  },
  fieldRowStrong: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
    marginBottom: 14,
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#111827",
  },
  fieldLabel: { fontSize: 10 },
  fieldValue: { fontSize: 10, fontWeight: "bold" },
  fieldValueStrong: { fontSize: 12, fontWeight: "bold", color: "#7c3aed" },
  signBlock: { marginTop: 70, alignItems: "flex-end" },
  signLine: { width: 220, borderTopWidth: 1, borderTopColor: "#9ca3af", paddingTop: 6, textAlign: "center", fontSize: 9, color: "#374151" },
  generatedAt: { position: "absolute", bottom: 24, left: 52, fontSize: 7, color: "#9ca3af" },
});

function Letterhead({ companyName, address, taxId }: { companyName: string; address: string; taxId: string }) {
  return (
    <View style={styles.letterhead}>
      <Text style={styles.letterheadName} wrap={false}>
        {companyName || "(ยังไม่ได้กรอกชื่อบริษัทในหน้าตั้งค่าระบบ)"}
      </Text>
      {address ? <Text style={styles.letterheadMeta}>{address}</Text> : null}
      {taxId ? (
        <Text style={styles.letterheadMeta} wrap={false}>
          เลขประจำตัวผู้เสียภาษี: {taxId}
        </Text>
      ) : null}
    </View>
  );
}

export interface ChannelDoc {
  channelLabel: string; // "หน้าร้าน" | "Delivery"
  salesIncVat: number;
  gpPercent: number;
  gpNoVat: number;
  gpVat: number;
  totalDebt: number;
  wht: number;
  netTransfer: number;
}

export interface BranchBillingDocsData {
  branchName: string;
  branchAddress: string;
  storefront: ChannelDoc | null;
  delivery: ChannelDoc | null;
  receiptTotal: number; // ยอดขายรวม VAT ทั้งสองช่องทาง — ใช้ในใบรับเงิน
}

export interface BillingPdfProps {
  companyName: string;
  companyTaxId: string;
  groupLegalName: string;
  periodMonthLabel: string;
  periodStartLabel: string;
  periodEndLabel: string;
  branches: BranchBillingDocsData[];
  includeSummarySheet: boolean;
  includeReceipt: boolean;
  applyWht: boolean; // false สำหรับห้างที่ไม่หัก ณ ที่จ่าย (เช่น Central, Tops) — ซ่อนแถวหัก ณ ที่จ่าย
  generatedAtLabel: string;
  fmtBaht: (n: number) => string;
}

function SummarySheetPage({
  companyName,
  companyTaxId,
  mallLegalName,
  branchAddress,
  periodMonthLabel,
  periodStartLabel,
  periodEndLabel,
  channel,
  applyWht,
  fmtBaht,
  generatedAtLabel,
}: {
  companyName: string;
  companyTaxId: string;
  mallLegalName: string;
  branchAddress: string;
  periodMonthLabel: string;
  periodStartLabel: string;
  periodEndLabel: string;
  channel: ChannelDoc;
  applyWht: boolean;
  fmtBaht: (n: number) => string;
  generatedAtLabel: string;
}) {
  return (
    <Page size="A4" style={styles.page}>
      {/* หัวเอกสาร = ผู้รับ (ห้าง) เพราะเป็นจดหมายที่เราส่งไปขอเงินคืนจากห้าง — ไม่ใช่ที่อยู่บริษัทเรา */}
      <Letterhead companyName={mallLegalName || "(ยังไม่ได้กรอกชื่อนิติบุคคลของห้างที่หน้าตั้งค่าวางบิล)"} address={branchAddress} taxId="" />
      <Text style={styles.title} wrap={false}>
        ใบสรุปยอดขายและยอดรับเช็ค ({channel.channelLabel})
      </Text>
      <Text style={styles.subtitle} wrap={false}>
        ประจำเดือน {periodMonthLabel}
      </Text>
      <View style={styles.paragraph}>
        {/* แยกเป็น 2 บรรทัดตายตัว (ไม่ใช้ paragraph เดียวให้ตัดบรรทัดอัตโนมัติ) เพราะ react-pdf มีบัคตัดตัวอักษร
            สุดท้ายก่อนจุดตัดบรรทัดหายกับข้อความไทยยาวๆ — บังคับจุดตัดเองด้วย wrap={false} ทีละบรรทัดแทน */}
        <Text wrap={false}>
          {companyName || "___________"} มีความประสงค์ขอยืนยันยอดขายและยอดเงินของบริษัทที่ทางห้างต้องชำระคืนให้
        </Text>
        <Text wrap={false}>
          ของยอดขายระหว่างวันที่ {periodStartLabel} ถึง {periodEndLabel} ดังรายละเอียดดังนี้
        </Text>
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel} wrap={false}>
          ยอดขายรวมภาษีมูลค่าเพิ่ม
        </Text>
        <Text style={styles.fieldValue} wrap={false}>
          {fmtBaht(channel.salesIncVat)} บาท
        </Text>
      </View>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel} wrap={false}>
          ส่วนลดการค้า GP {(channel.gpPercent * 100).toLocaleString("th-TH", { maximumFractionDigits: 2 })}%
        </Text>
        <Text style={styles.fieldValue} wrap={false}>
          {fmtBaht(channel.gpNoVat)} บาท
        </Text>
      </View>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel} wrap={false}>
          Vat 7% ค่าบริการ
        </Text>
        <Text style={styles.fieldValue} wrap={false}>
          {fmtBaht(channel.gpVat)} บาท
        </Text>
      </View>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel} wrap={false}>
          รวมเงินที่ต้องชำระ
        </Text>
        <Text style={styles.fieldValue} wrap={false}>
          {fmtBaht(channel.totalDebt)} บาท
        </Text>
      </View>
      {applyWht && (
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel} wrap={false}>
            บวกภาษีหัก ณ ที่จ่าย 3%
          </Text>
          <Text style={styles.fieldValue} wrap={false}>
            {fmtBaht(channel.wht)} บาท
          </Text>
        </View>
      )}
      <View style={styles.fieldRowStrong}>
        <Text style={styles.fieldLabel} wrap={false}>
          จำนวนเงินที่ต้องชำระสุทธิ
        </Text>
        <Text style={styles.fieldValueStrong} wrap={false}>
          {fmtBaht(channel.netTransfer)} บาท
        </Text>
      </View>

      <Text style={{ fontSize: 10, marginTop: 20 }} wrap={false}>
        จึงเรียนมาเพื่อทราบและดำเนินการ
      </Text>

      <View style={styles.signBlock}>
        <Text style={{ ...styles.signLine, textAlign: "left", borderTopWidth: 0, paddingTop: 0 }} wrap={false}>
          {companyName || "___________"}
        </Text>
        {companyTaxId ? (
          <Text style={{ fontSize: 8, color: "#6b7280", marginBottom: 6 }} wrap={false}>
            เลขประจำตัวผู้เสียภาษี: {companyTaxId}
          </Text>
        ) : null}
        <Text style={styles.signLine} wrap={false}>
          ลงชื่อ
        </Text>
      </View>

      <Text style={styles.generatedAt} wrap={false} fixed>
        สร้างเอกสารเมื่อ {generatedAtLabel} — เอกสารนี้สร้างจากระบบ Lamunn Finance
      </Text>
    </Page>
  );
}

function ReceiptPage({
  branchAddress,
  companyTaxId,
  mallLegalName,
  periodStartLabel,
  periodEndLabel,
  receiptTotal,
  fmtBaht,
  generatedAtLabel,
}: {
  branchAddress: string;
  companyTaxId: string;
  mallLegalName: string;
  periodStartLabel: string;
  periodEndLabel: string;
  receiptTotal: number;
  fmtBaht: (n: number) => string;
  generatedAtLabel: string;
}) {
  return (
    <Page size="A4" style={styles.page}>
      {/* หัวเอกสาร = ผู้รับ (ห้าง) เหมือนใบสรุปยอด — สอดคล้องกัน ไม่ใช่ที่อยู่บริษัทเรา */}
      <Letterhead companyName={mallLegalName || "(ยังไม่ได้กรอกชื่อนิติบุคคลของห้างที่หน้าตั้งค่าวางบิล)"} address={branchAddress} taxId="" />
      <Text style={styles.title} wrap={false}>
        ใบรับเงิน
      </Text>
      <View style={{ ...styles.paragraph, marginTop: 20 }}>
        <Text wrap={false}>ทางร้าน Lamunn ได้รับเงินคืนจากการฝากเก็บรักษาไว้ระหว่าง</Text>
        <Text wrap={false}>
          วันที่ {periodStartLabel} ถึง {periodEndLabel} จาก {mallLegalName || "___________"}
        </Text>
      </View>

      <View style={styles.fieldRowStrong}>
        <Text style={styles.fieldLabel} wrap={false}>
          เป็นเงิน
        </Text>
        <Text style={styles.fieldValueStrong} wrap={false}>
          {fmtBaht(receiptTotal)} บาท
        </Text>
      </View>

      <Text style={{ fontSize: 10, marginTop: 4 }} wrap={false}>
        ตามยอดขาย P/O
      </Text>

      <View style={styles.signBlock}>
        <Text style={styles.signLine} wrap={false}>
          ผู้รับเงิน
        </Text>
        <Text style={{ fontSize: 9, color: "#6b7280", marginTop: 4 }} wrap={false}>
          ประทับตราบริษัท
        </Text>
      </View>

      <Text style={styles.generatedAt} wrap={false} fixed>
        สร้างเอกสารเมื่อ {generatedAtLabel} — เอกสารนี้สร้างจากระบบ Lamunn Finance
      </Text>
    </Page>
  );
}

function BillingDocument(props: BillingPdfProps) {
  const {
    companyName,
    companyTaxId,
    groupLegalName,
    periodMonthLabel,
    periodStartLabel,
    periodEndLabel,
    branches,
    includeSummarySheet,
    includeReceipt,
    applyWht,
    generatedAtLabel,
    fmtBaht,
  } = props;

  return (
    <Document>
      {branches.flatMap((b) => {
        const pages: JSX.Element[] = [];
        if (includeSummarySheet && b.storefront) {
          pages.push(
            <SummarySheetPage
              key={`${b.branchName}-storefront`}
              companyName={companyName}
              companyTaxId={companyTaxId}
              mallLegalName={groupLegalName}
              branchAddress={b.branchAddress}
              periodMonthLabel={periodMonthLabel}
              periodStartLabel={periodStartLabel}
              periodEndLabel={periodEndLabel}
              channel={b.storefront}
              applyWht={applyWht}
              fmtBaht={fmtBaht}
              generatedAtLabel={generatedAtLabel}
            />
          );
        }
        if (includeSummarySheet && b.delivery) {
          pages.push(
            <SummarySheetPage
              key={`${b.branchName}-delivery`}
              companyName={companyName}
              companyTaxId={companyTaxId}
              mallLegalName={groupLegalName}
              branchAddress={b.branchAddress}
              periodMonthLabel={periodMonthLabel}
              periodStartLabel={periodStartLabel}
              periodEndLabel={periodEndLabel}
              channel={b.delivery}
              applyWht={applyWht}
              fmtBaht={fmtBaht}
              generatedAtLabel={generatedAtLabel}
            />
          );
        }
        if (includeReceipt) {
          pages.push(
            <ReceiptPage
              key={`${b.branchName}-receipt`}
              branchAddress={b.branchAddress}
              companyTaxId={companyTaxId}
              mallLegalName={groupLegalName}
              periodStartLabel={periodStartLabel}
              periodEndLabel={periodEndLabel}
              receiptTotal={b.receiptTotal}
              fmtBaht={fmtBaht}
              generatedAtLabel={generatedAtLabel}
            />
          );
        }
        return pages;
      })}
    </Document>
  );
}

export async function renderBillingPdf(props: BillingPdfProps): Promise<Buffer> {
  ensureFontsRegistered();
  return renderToBuffer(<BillingDocument {...props} />);
}
