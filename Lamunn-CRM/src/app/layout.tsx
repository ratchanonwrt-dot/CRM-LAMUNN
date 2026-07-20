import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { getLocale } from "@/lib/i18n-server";

export const metadata: Metadata = {
  title: "Lamunn CRM — ระบบสะสมแต้ม",
  description: "ระบบ CRM สะสมแต้มลูกค้า 21 สาขา",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  return (
    <html lang={locale}>
      <body>
        <Providers initialLocale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
