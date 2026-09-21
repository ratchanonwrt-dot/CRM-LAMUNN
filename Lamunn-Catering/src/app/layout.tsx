import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Lamunn Catering — บันทึกการจองจัดเลี้ยง",
  description: "ระบบบันทึกการจองจัดเลี้ยง สถานะการชำระเงิน จัดคน และยอดนัดรับหน้าร้าน",
};

export const viewport: Viewport = {
  themeColor: "#dc6103",
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
