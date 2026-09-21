import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ขอใบกำกับภาษี",
  description: "สแกน QR จากใบเสร็จเพื่อขอใบกำกับภาษี",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-screen text-gray-900">
        <div className="mx-auto max-w-4xl px-4 py-8">{children}</div>
      </body>
    </html>
  );
}
