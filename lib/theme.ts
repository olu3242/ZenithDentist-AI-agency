import { ZenithTokens } from "@/lib/brand/tokens";

export const themeConfig = {
  name: "Zenith Global Theme",
  mode: "light",
  colors: ZenithTokens.colors,
  gradients: ZenithTokens.gradients,
  spacing: ZenithTokens.spacing,
  radius: ZenithTokens.radius,
  typography: ZenithTokens.typography,
  elevation: ZenithTokens.elevation,
  motion: ZenithTokens.motion,
  cssVariables: {
    "--primary": ZenithTokens.colors.primary,
    "--secondary": ZenithTokens.colors.secondary,
    "--accent": ZenithTokens.colors.accent,
    "--success": ZenithTokens.colors.success,
    "--warning": ZenithTokens.colors.warning,
    "--danger": ZenithTokens.colors.danger,
    "--background": ZenithTokens.colors.background,
    "--surface": ZenithTokens.colors.surface,
    "--card": ZenithTokens.colors.card,
    "--foreground": ZenithTokens.colors.foreground,
    "--muted": ZenithTokens.colors.muted,
    "--border": ZenithTokens.colors.border,
    "--brand-primary": ZenithTokens.colors.primary,
    "--brand-secondary": ZenithTokens.colors.secondary,
    "--brand-accent": ZenithTokens.colors.accent,
    "--brand-success": ZenithTokens.colors.success,
    "--brand-warning": ZenithTokens.colors.warning,
    "--brand-danger": ZenithTokens.colors.danger,
    "--brand-background": ZenithTokens.colors.background,
    "--brand-surface": ZenithTokens.colors.surface,
    "--brand-card": ZenithTokens.colors.card,
    "--brand-text": ZenithTokens.colors.foreground,
    "--brand-muted": ZenithTokens.colors.muted,
    "--brand-border": ZenithTokens.colors.border,
    "--brand-sidebar": ZenithTokens.colors.navy
  }
} as const;

export type ThemeConfig = typeof themeConfig;
