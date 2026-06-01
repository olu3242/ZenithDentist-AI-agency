import { ZenithTokens } from "@/lib/brand/tokens";

export const brandConfig = {
  name: "ZENITH PROS",
  legalName: "Zenith AI Automation Agency",
  shortName: "ZENITH",
  productName: "Patient Revenue Operating System",
  productAcronym: "PROS",
  trademark: "Patient Revenue Operating System™",
  tagline: "Recover revenue. Fill chairs. Grow production.",
  descriptor: "Patient Revenue Operating System™",
  productTagline: "Dental revenue operations platform",
  logoMark: "Z",
  personality: [
    "Clinical",
    "Intelligent",
    "Operational",
    "Revenue-accountable",
    "Trustworthy",
    "Enterprise-ready"
  ],
  colors: ZenithTokens.colors,
  gradients: ZenithTokens.gradients,
  tokens: ZenithTokens
} as const;

export type BrandConfig = typeof brandConfig;
