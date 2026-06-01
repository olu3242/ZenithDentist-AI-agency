import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // ── Zenith AI Design Tokens ──────────────────────────────────────
        primary:   "#2563EB",
        secondary: "#06B6D4",
        accent:    "#14B8A6",

        success: "#22C55E",
        warning: "#F59E0B",
        danger:  "#EF4444",

        background: "#0F172A",
        surface:    "#111827",
        card:       "#1E293B",

        // ── Legacy aliases → new palette (backward compat) ───────────────
        ink:   "#111827",
        muted: "#94A3B8",
        paper: "#0F172A",
        line:  "#1E293B",
        teal:  "#14B8A6",
        rust:  "#EF4444",
        gold:  "#F59E0B",
        green: "#22C55E",
        blue:  "#2563EB",
      },
      borderRadius: {
        DEFAULT: "8px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        soft: "0 4px 24px rgba(0,0,0,0.4)",
        card: "0 2px 8px rgba(0,0,0,0.3)",
        glow: "0 0 24px rgba(37,99,235,0.25)",
      },
    }
  },
  plugins: [animate]
};

export default config;
