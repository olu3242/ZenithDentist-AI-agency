import "server-only";

/**
 * Partner Engine — tracks dental consultant, agency, and technology partners.
 */

export type PartnerType = "dental_consultant" | "marketing_agency" | "practice_coach" | "implementation_partner" | "technology_partner";

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  tier: "platinum" | "gold" | "silver" | "registered";
  referralsSubmitted: number;
  referralsConverted: number;
  mrrGenerated: number;
  commissionRate: number;
  activeCustomers: number;
}

export interface PartnerEcosystemSummary {
  totalPartners: number;
  activePartners: number;
  totalReferralMrr: number;
  totalCommissionsPaid: number;
  byType: Record<PartnerType, number>;
}

// In-memory partner registry until a partners table exists
const PARTNER_REGISTRY: Partner[] = [];

export function registerPartner(partner: Partner): void {
  const existing = PARTNER_REGISTRY.findIndex(p => p.id === partner.id);
  if (existing >= 0) {
    PARTNER_REGISTRY[existing] = partner;
  } else {
    PARTNER_REGISTRY.push(partner);
  }
}

export function getPartnerEcosystemSummary(): PartnerEcosystemSummary {
  const active = PARTNER_REGISTRY.filter(p => p.referralsConverted > 0 || p.activeCustomers > 0);
  const byType = {} as Record<PartnerType, number>;

  for (const p of PARTNER_REGISTRY) {
    byType[p.type] = (byType[p.type] ?? 0) + 1;
  }

  return {
    totalPartners: PARTNER_REGISTRY.length,
    activePartners: active.length,
    totalReferralMrr: PARTNER_REGISTRY.reduce((s, p) => s + p.mrrGenerated, 0),
    totalCommissionsPaid: PARTNER_REGISTRY.reduce((s, p) => s + p.mrrGenerated * p.commissionRate, 0),
    byType,
  };
}
