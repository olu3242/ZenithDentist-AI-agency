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
        ink: "#18212f",
        muted: "#657286",
        paper: "#f7f5ef",
        line: "#d9e0e7",
        teal: "#177f75",
        rust: "#b95031",
        gold: "#be8b2d",
        green: "#3d8f5f",
        blue: "#386fa4"
      },
      borderRadius: {
        DEFAULT: "8px"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(24, 33, 47, 0.12)"
      }
    }
  },
  plugins: [animate]
};

export default config;
