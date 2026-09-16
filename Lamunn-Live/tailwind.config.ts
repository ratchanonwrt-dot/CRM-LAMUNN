import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // ชุดสีคนไลฟ์ (STREAMER_PALETTE) อยู่ใน src/lib — ต้องสแกนด้วย ไม่งั้น class สีไม่ถูกสร้าง
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // พื้นผิวกระดาษอุ่น ๆ + หมึกเข้ม แทนเทา/ขาวมาตรฐาน
        paper: "#f5f3ee",
        ink: "#1b1a17",
        muted: "#6e6960",
        line: "#e5e0d6",
        // Accent ของแอปหลังบ้าน: ส้มอิฐ (ember) — ใช้เน้นจุดสำคัญ ไม่เททั้งหน้า
        brand: {
          50: "#fff4ee",
          100: "#ffe5d6",
          200: "#ffc8ad",
          300: "#ffa27a",
          400: "#fb7a47",
          500: "#ef5a26",
          600: "#d3441a",
          700: "#ad3515",
          800: "#8b2c15",
          900: "#722713",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(27, 26, 23, 0.04), 0 10px 30px -18px rgba(27, 26, 23, 0.25)",
        pop: "0 24px 60px -20px rgba(27, 26, 23, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
