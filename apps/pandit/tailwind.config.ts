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
        saffron:  { DEFAULT: "#E8560A", dark: "#B8400A", soft: "#F47B3A", bg: "#2A1206" },
        marigold: { DEFAULT: "#F5A623", bg: "#261800" },
        gold:     { DEFAULT: "#D4A017", bg: "#231600" },
        bg:       { DEFAULT: "#1C1008", card: "#251508", light: "#2E1C0A" },
        cream:    { DEFAULT: "#FFF3DC", dim: "#C8A870" },
        green:    { DEFAULT: "#2ECC71", bg: "#0D2B1A" },
        red:      { DEFAULT: "#E74C3C", bg: "#2B0D0D" },
        blue:     { DEFAULT: "#3498DB", bg: "#0D1F2B" },
      },
      fontFamily: {
        sans:  ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
      animation: {
        "spin":       "spin 0.8s linear infinite",
        "pulse-soft": "pulse 1.5s ease-in-out infinite",
        "bell-ring":  "bellRing 0.6s ease infinite",
      },
      keyframes: {
        bellRing: {
          "0%,100%": { transform: "rotate(0)" },
          "20%":     { transform: "rotate(15deg)" },
          "40%":     { transform: "rotate(-15deg)" },
          "60%":     { transform: "rotate(10deg)" },
          "80%":     { transform: "rotate(-10deg)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;