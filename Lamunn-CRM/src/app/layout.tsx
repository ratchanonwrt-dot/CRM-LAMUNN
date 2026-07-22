import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { getLocale } from "@/lib/i18n-server";
import { getAppSettings } from "@lamunn/db";
import { buildNavOverrides } from "@/lib/content";

export const metadata: Metadata = {
  title: "Lamunn CRM — ระบบสะสมแต้ม",
  description: "ระบบ CRM สะสมแต้มลูกค้า 21 สาขา",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  const settings = await getAppSettings();
  const navOverrides = buildNavOverrides(settings);
  return (
    <html lang={locale}>
      <body>
        <Providers initialLocale={locale} navOverrides={navOverrides}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
