import "server-only";

export { getReferralSummary } from "@/lib/referral-os/referral-tracking";
export type { ReferralRecord, ReferralSummary } from "@/lib/referral-os/referral-tracking";

export { assessCustomerAdvocacy } from "@/lib/referral-os/advocacy-engine";
export type { CustomerAdvocacyProfile, AdvocacyTier } from "@/lib/referral-os/advocacy-engine";

export { registerPartner, getPartnerEcosystemSummary } from "@/lib/referral-os/partner-engine";
export type { Partner, PartnerType, PartnerEcosystemSummary } from "@/lib/referral-os/partner-engine";
