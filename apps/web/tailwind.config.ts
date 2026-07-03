import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron:  { DEFAULT: "#E8560A", dark: "#B8400A", light: "#F47B3A", 50: "#FFF3EC", 100: "#FFE4D0", 500: "#E8560A", 700: "#B8400A" },
        marigold: { DEFAULT: "#F5A623", light: "#FAC65A", 50: "#FFFBE8" },
        bark:     { DEFAULT: "#5C3317", light: "#7A4A28" },
        cream:    { DEFAULT: "#FFF8EE", dark: "#F0E4CE" },
      },
      fontFamily: {
        sans:  ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "fade-up":   "fadeUp 0.5s ease forwards",
        "pulse-soft":"pulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        saffron:  "0 4px 24px rgba(232,86,10,0.15)",
        card:     "0 2px 16px rgba(92,51,23,0.08)",
        elevated: "0 8px 32px rgba(92,51,23,0.12)",
      },
      borderRadius: {
        xl2: "1rem",
        xl3: "1.5rem",
        xl4: "2rem",
      },
    },
  },
  plugins: [],
};

export default config;