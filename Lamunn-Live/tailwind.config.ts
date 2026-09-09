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
      colors: {
        // Rose/red — distinct from Catering's orange and Finance's palette so browser tabs are easy to tell apart.
        brand: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
        },
      },
    },
  },
  plugins: [],
};

export default config;
