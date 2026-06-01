export const ZenithTokens = {
  colors: {
    primary: "#2563EB",
    secondary: "#06B6D4",
    accent: "#14B8A6",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    navy: "#0B1020",
    background: "#F8FAFC",
    surface: "#F1F5F9",
    card: "#FFFFFF",
    foreground: "#0F172A",
    muted: "#64748B",
    border: "#E2E8F0"
  },
  gradients: {
    primary: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
    sidebar: "linear-gradient(180deg, #0B1020 0%, #111827 100%)",
    hero: "linear-gradient(135deg, #0B1020 0%, #2563EB 50%, #06B6D4 100%)"
  },
  spacing: {
    shell: "1.25rem",
    section: "2rem",
    card: "1.25rem"
  },
  radius: {
    sm: "6px",
    md: "8px",
    lg: "12px",
    full: "999px"
  },
  typography: {
    heading: "Inter",
    body: "Inter",
    weightHeading: 800,
    weightBody: 400
  },
  elevation: {
    card: "0 18px 45px rgba(15, 23, 42, 0.10)",
    sidebar: "0 24px 70px rgba(11, 16, 32, 0.28)"
  },
  motion: {
    fast: "140ms ease",
    standard: "220ms ease"
  }
} as const;

export type ZenithTokens = typeof ZenithTokens;
