import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lamunn Live — จองช่วงไลฟ์",
  description: "ดูช่วงเวลาไลฟ์ที่ว่าง และส่งคำขอจองช่วงไลฟ์กับ Lamunn",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
