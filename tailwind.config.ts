import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "pilltime-blue": "#3B82F6",
        "pilltime-violet": "#8B5CF6",
        "pilltime-teal": "#14B8A6",
        "pilltime-orange": "#F97316",
        "pilltime-yellow": "#EAB308",
        "pilltime-grayLight": "#F9FAFB",
        "pilltime-grayDark": "#1F2937",
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
