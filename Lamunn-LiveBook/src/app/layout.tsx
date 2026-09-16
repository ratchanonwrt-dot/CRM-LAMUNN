import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai, Anuphan } from "next/font/google";
import "./globals.css";

const sans = IBM_Plex_Sans_Thai({ subsets: ["thai", "latin"], weight: ["400", "500", "600"], variable: "--font-sans", display: "swap" });
const display = Anuphan({ subsets: ["thai", "latin"], weight: ["500", "600", "700"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "Lamunn Live — จองช่วงไลฟ์",
  description: "ดูช่วงเวลาไลฟ์ที่ว่าง และส่งคำขอจองช่วงไลฟ์กับ Lamunn",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1b1a17",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${sans.variable} ${display.variable}`}>
      <body className="bg-paper text-ink">{children}</body>
    </html>
  );
}
