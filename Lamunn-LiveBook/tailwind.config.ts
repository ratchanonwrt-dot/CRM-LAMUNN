import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}", "./src/lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        paper: "#f5f3ee",
        ink: "#1b1a17",
        muted: "#6e6960",
        line: "#e5e0d6",
        // Accent ของเว็บจอง: เขียวเข้ม (forest) — คนละโทนกับหลังบ้าน
        brand: {
          50: "#eefaf5",
          100: "#d4f2e6",
          200: "#abe4cf",
          300: "#74ceb1",
          400: "#3fb08f",
          500: "#219373",
          600: "#15765d",
          700: "#125e4c",
          800: "#124b3e",
          900: "#103e34",
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
