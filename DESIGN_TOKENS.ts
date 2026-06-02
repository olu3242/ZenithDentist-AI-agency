export const designTokens = {
  layout: {
    shellSidebarWidth: "260px",
    contentMaxWidth: "80rem",
    contentPaddingMobile: "1rem",
    contentPaddingDesktop: "2rem",
    sectionGap: "1.5rem",
    cardGap: "1rem"
  },
  cards: {
    radius: "8px",
    padding: "1.25rem",
    minKpiHeight: "10rem",
    shadow: "0 18px 45px rgba(15, 23, 42, 0.10)"
  },
  typography: {
    pageTitle: "clamp(1.75rem, 2.2vw, 2.5rem)",
    sectionTitle: "1.125rem",
    body: "0.875rem"
  },
  watermark: {
    opacity: 0.035,
    zIndex: 0
  }
} as const;

export type DesignTokens = typeof designTokens;
