import type { Config } from "tailwindcss";

/** โทนสีของทั้งแอป — แก้ที่นี่ที่เดียวแล้วทุกหน้าเปลี่ยนตาม เพราะทุกคอมโพเนนต์อ้างคลาส gray-... และ brand-... ผ่าน Tailwind
 *
 * gray: เขียนทับสเกลเทาของ Tailwind ด้วยเทาอมอุ่น (paper, stone) แทนเทาอมฟ้าค่าเริ่มต้น
 *       พื้นหลังจะเป็นสีกระดาษนวลๆ เส้นขอบนุ่มลง ตัวหนังสือเป็นสี ink ไม่ใช่ดำสนิท — ดูเป็นงานออกแบบมากกว่า template
 * brand: น้ำเงินหมึกที่เข้มและอิ่มกว่าเดิม ใช้เป็นสีหลักสีเดียว สีอื่น (amber/emerald/rose) เหลือไว้บอกสถานะเท่านั้น */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      colors: {
        gray: {
          50: "#f8f7f4",
          100: "#f1efea",
          200: "#e6e3dc",
          300: "#d4d0c7",
          400: "#a39e93",
          500: "#78736a",
          600: "#5a564e",
          700: "#423f39",
          800: "#2a2823",
          900: "#1a1916",
        },
        brand: {
          50: "#eef3fb",
          100: "#dbe5f5",
          200: "#b9cdeb",
          300: "#8aaedd",
          400: "#5788cb",
          500: "#3468b5",
          600: "#26539a",
          700: "#1f437d",
          800: "#1b3864",
          900: "#172f52",
        },
      },
      boxShadow: {
        // เงาบางๆ แบบกระดาษวางซ้อน ใช้แทน shadow-md/lg ที่ฟุ้ง
        card: "0 1px 2px rgba(26, 25, 22, 0.04), 0 1px 1px rgba(26, 25, 22, 0.03)",
      },
    },
  },
  plugins: [],
};

export default config;
