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
        marigold: { DEFAULT: "#F5A623", light: "#FAC65A" },
        gold:     { DEFAULT: "#D4A017", bg: "#151000" },
        bg:       { DEFAULT: "#0D0D0F", card: "#141416", elevated: "#1A1A1E", hover: "#1F1F24" },
        green:    { DEFAULT: "#22C55E", bg: "#071A0F" },
        red:      { DEFAULT: "#EF4444", bg: "#1A0707" },
        blue:     { DEFAULT: "#3B82F6", bg: "#070F1A" },
        purple:   { DEFAULT: "#A855F7", bg: "#100718" },
      },
      fontFamily: {
        sans:  ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
      animation: {
        "fade-in":  "fadeIn 0.3s ease forwards",
        "slide-in": "slideIn 0.3s ease forwards",
        "pulse-soft":"pulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideIn: { "0%": { opacity: "0", transform: "translateX(-10px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
      },
      boxShadow: {
        card: "0 2px 16px rgba(0,0,0,0.3)",
        elevated: "0 8px 32px rgba(0,0,0,0.4)",
      },
      borderRadius: {
        xl2: "1rem",
        xl3: "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;