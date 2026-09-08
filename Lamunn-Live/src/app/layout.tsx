import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Lamunn Live — บันทึกและวิเคราะห์ยอดไลฟ์",
  description: "บันทึกยอดคนดู ยอดขาย และคนไลฟ์ในแต่ละช่วงเวลา เพื่อวิเคราะห์ว่าช่วงไหนดี ใครไลฟ์เก่ง",
};

export const viewport: Viewport = {
  themeColor: "#e11d48",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
