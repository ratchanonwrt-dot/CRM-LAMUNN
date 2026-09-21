import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

// ฟอนต์ไทย-ละตินชุดเดียวทั้งแอป — next/font ดาวน์โหลดตอน build แล้วเสิร์ฟจากโดเมนเราเอง (self-host)
// พร้อม preload อัตโนมัติ: ไม่ต้องวิ่งไป Google ตอนเปิดหน้า และไม่มีตัวหนังสือกระโดดตอนฟอนต์มาถึง
// เลือก IBM Plex Sans Thai เพราะเป็นฟอนต์ที่ออกแบบไทย+ละตินให้เข้ากันจริง ตัวเลขชัด อ่านตารางง่าย
const fontSans = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lamunn Finance — บันทึกยอดขายรายวัน",
  description: "ระบบบันทึกยอดขายรายวัน ค่าเช่า Credit Term และสถานะเงินสด",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    // "Add to Home Screen" บน iOS ใช้ค่านี้ — ทำให้เปิดแบบเต็มจอไม่มีแถบ Safari ด้านล่าง
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lamunn Finance",
  },
};

export const viewport: Viewport = {
  themeColor: "#26539a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={fontSans.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
