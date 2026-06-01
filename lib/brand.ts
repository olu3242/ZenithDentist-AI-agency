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
