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
        ink: "#0A0F1C",
        muted: "#64748B",
        paper: "#F1F5F9",
        line: "#E2E8F0",
        teal: "#14B8A6",
        rust: "#EF4444",
        gold: "#F59E0B",
        green: "#22C55E",
        blue: "#0EA5E9",
        primary: "#0EA5E9",
        secondary: "#14B8A6",
        accent: "#38BDF8",
        background: "#F8FAFC",
        foreground: "#0F172A",
        border: "#E2E8F0",
        surface: "#F1F5F9",
        card: "#FFFFFF",
        navy: "#0A0F1C",
        danger: "#EF4444",
        warning: "#F59E0B"
      },
      borderRadius: {
        DEFAULT: "8px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.10)"
      }
    }
  },
  plugins: [animate]
};

export default config;
