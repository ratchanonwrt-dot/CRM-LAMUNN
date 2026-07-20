import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Lamunn CRM — หลังบ้าน",
  description: "ระบบจัดการสาขา พนักงาน กติกาสะสมแต้ม รางวัล และรายงาน",
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
