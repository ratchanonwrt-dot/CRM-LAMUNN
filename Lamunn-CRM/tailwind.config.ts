import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2fbf6",
          100: "#e0f7e9",
          200: "#b9ecce",
          300: "#86dcac",
          400: "#4fc684",
          500: "#2aab63",
          600: "#1c8a4e",
          700: "#186e40",
          800: "#175735",
          900: "#14482d",
        },
      },
    },
  },
  plugins: [],
};

export default config;
