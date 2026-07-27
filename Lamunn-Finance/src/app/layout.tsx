import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Lamunn Finance — บันทึกยอดขายรายวัน",
  description: "ระบบบันทึกยอดขายรายวัน ค่าเช่า Credit Term และสถานะเงินสด 23 สาขา",
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
