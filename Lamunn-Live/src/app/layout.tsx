import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai, Anuphan } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

// ตัวอักษร: IBM Plex Sans Thai สำหรับเนื้อหา (อ่านตัวเลข/ตารางชัด) + Anuphan สำหรับหัวข้อ
const sans = IBM_Plex_Sans_Thai({ subsets: ["thai", "latin"], weight: ["400", "500", "600"], variable: "--font-sans", display: "swap" });
const display = Anuphan({ subsets: ["thai", "latin"], weight: ["500", "600", "700"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "Lamunn Live — บันทึกและวิเคราะห์ยอดไลฟ์",
  description: "บันทึกยอดคนดู ยอดขาย และคนไลฟ์ในแต่ละช่วงเวลา เพื่อวิเคราะห์ว่าช่วงไหนดี ใครไลฟ์เก่ง",
};

export const viewport: Viewport = {
  themeColor: "#1b1a17",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${sans.variable} ${display.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
