import { ZenithTokens } from "@/lib/brand/tokens";
import { LEGAL_ENTITY } from "@/lib/legal-entity";

export const brandConfig = {
  name: "Zenith Pros",
  legalName: LEGAL_ENTITY.legalName,
  brandName: LEGAL_ENTITY.brandName,
  dbaName: LEGAL_ENTITY.dbaName,
  taxEntity: LEGAL_ENTITY.taxEntity,
  billingEntity: LEGAL_ENTITY.billingEntity,
  contractEntity: LEGAL_ENTITY.contractEntity,
  paymentRecipient: LEGAL_ENTITY.paymentRecipient,
  shortName: "ZENITH",
  productName: "Patient Revenue Operating System",
  productAcronym: "PROS",
  tagline: "Recover revenue. Fill chairs. Grow production.",
  descriptor: "Patient Revenue Operating System",
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
