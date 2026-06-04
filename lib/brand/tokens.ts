export const ZenithTokens = {
  colors: {
    primary: "#0EA5E9",
    secondary: "#14B8A6",
    accent: "#38BDF8",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    navy: "#0A0F1C",
    navyElevated: "#111827",
    slate: "#1E293B",
    slateHover: "#24344D",
    background: "#F8FAFC",
    surface: "#F1F5F9",
    card: "#FFFFFF",
    foreground: "#0F172A",
    muted: "#64748B",
    border: "#E2E8F0",
    inverseText: "#F8FAFC",
    inverseMuted: "#94A3B8"
  },
  gradients: {
    primary: "linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%)",
    sidebar: "linear-gradient(180deg, #0A0F1C 0%, #111827 100%)",
    hero: "linear-gradient(135deg, #0A0F1C 0%, #111827 42%, #0EA5E9 72%, #14B8A6 100%)",
    signal: "linear-gradient(135deg, rgba(14,165,233,0.18) 0%, rgba(20,184,166,0.14) 100%)"
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
    sidebar: "0 24px 70px rgba(10, 15, 28, 0.35)",
    glow: "0 0 0 1px rgba(14, 165, 233, 0.16), 0 20px 55px rgba(14, 165, 233, 0.12)"
  },
  motion: {
    fast: "140ms ease",
    standard: "220ms ease"
  }
} as const;

export type ZenithTokens = typeof ZenithTokens;
