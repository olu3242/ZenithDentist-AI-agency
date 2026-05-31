/**
 * Zenith AI — Canonical Brand Definition
 *
 * Single source of truth for all brand values.
 * Every color, typeface, logo, and copy reference flows from here.
 */

export const BRAND = {
  name: "Zenith AI",
  tagline: "Dental Revenue Intelligence Platform",
  domain: "zenith.ai",

  logo: {
    mark: "Z",
    wordmark: "ZENITH AI",
    full: "Zenith AI",
    submarks: {
      portal: "ZENITH PORTAL",
      admin: "ZENITH OPS",
      missionControl: "MISSION CONTROL",
      internal: "ZENITH INTERNAL",
    },
  },

  colors: {
    // Core brand
    primary:   "#2563EB",
    secondary: "#06B6D4",
    accent:    "#14B8A6",

    // Semantic
    success: "#22C55E",
    warning: "#F59E0B",
    danger:  "#EF4444",

    // Surfaces (dark theme — the platform's native mode)
    background: "#0F172A",
    surface:    "#111827",
    card:       "#1E293B",
    border:     "#1E293B",

    // Text
    text:  "#F8FAFC",
    muted: "#94A3B8",
  },

  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    fontVariable: "--font-inter",
  },

  radius: {
    sm:  "6px",
    md:  "8px",
    lg:  "12px",
    xl:  "16px",
  },

  shadow: {
    soft: "0 4px 24px rgba(0,0,0,0.4)",
    card: "0 2px 8px rgba(0,0,0,0.3)",
    glow: "0 0 24px rgba(37,99,235,0.25)",
  },
} as const;

export type BrandColor = keyof typeof BRAND.colors;

/** CSS custom property name → BRAND.colors key */
export const CSS_VARS: Record<BrandColor, string> = {
  primary:    "--brand-primary",
  secondary:  "--brand-secondary",
  accent:     "--brand-accent",
  success:    "--brand-success",
  warning:    "--brand-warning",
  danger:     "--brand-danger",
  background: "--brand-background",
  surface:    "--brand-surface",
  card:       "--brand-card",
  border:     "--brand-border",
  text:       "--brand-text",
  muted:      "--brand-muted",
};

/** Generate a :root CSS block from BRAND.colors */
export function buildCSSVars(): string {
  return Object.entries(CSS_VARS)
    .map(([key, varName]) => `  ${varName}: ${BRAND.colors[key as BrandColor]};`)
    .join("\n");
}
