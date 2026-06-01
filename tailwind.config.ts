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
        ink: "#0B1020",
        muted: "#64748B",
        paper: "#F1F5F9",
        line: "#E2E8F0",
        teal: "#14B8A6",
        rust: "#EF4444",
        gold: "#F59E0B",
        green: "#22C55E",
        blue: "#2563EB",
        primary: "#2563EB",
        secondary: "#06B6D4",
        accent: "#14B8A6",
        background: "#F8FAFC",
        foreground: "#0F172A",
        border: "#E2E8F0",
        surface: "#F1F5F9",
        card: "#FFFFFF",
        navy: "#0B1020",
        danger: "#EF4444",
        warning: "#F59E0B"
      },
      borderRadius: {
        DEFAULT: "8px"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.10)"
      }
    }
  },
  plugins: [animate]
};

export default config;
