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
          50: "#fff8eb",
          100: "#ffecc6",
          200: "#ffd889",
          300: "#ffbe4c",
          400: "#ffa41f",
          500: "#f98307",
          600: "#dc6103",
          700: "#b64306",
          800: "#93340c",
          900: "#792c0e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
