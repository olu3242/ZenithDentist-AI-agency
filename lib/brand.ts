import { ZenithTokens } from "@/lib/brand/tokens";

export const brandConfig = {
  name: "ZENITH AI AUTOMATION AGENCY",
  shortName: "ZENITH",
  tagline: "Automate. Scale. Dominate.",
  descriptor: "AI Automation Agency",
  productTagline: "Patient Revenue Engine",
  logoMark: "Z",
  personality: [
    "Enterprise",
    "Intelligent",
    "Trustworthy",
    "Premium",
    "Modern AI",
    "Operational Excellence"
  ],
  colors: ZenithTokens.colors,
  gradients: ZenithTokens.gradients,
  tokens: ZenithTokens
} as const;

// BRAND alias — used by brand-sidebar and brand-logo components
export const BRAND = {
  name: brandConfig.name,
  tagline: brandConfig.tagline,
  logo: {
    mark: brandConfig.logoMark,
    wordmark: brandConfig.shortName,
    submarks: {
      portal: "ZENITH PORTAL",
      admin: "ZENITH OPS",
      missionControl: "MISSION CONTROL",
      internal: "ZENITH INTERNAL",
    },
  },
  colors: brandConfig.colors,
} as const;
