import "server-only";

/**
 * Referral Tracking — tracks customer referrals and partner-sourced revenue.
 */

import { createServiceClient } from "@/lib/supabase/server";

export interface ReferralRecord {
  id: string;
  referrerOrganizationId: string;
  referredOrganizationId: string | null;
  referredCompanyName: string;
  status: "pending" | "converted" | "lost";
  sourceType: "customer" | "partner" | "review";
  mrrGenerated: number;
  createdAt: string;
}

export interface ReferralSummary {
  totalReferrals: number;
  convertedReferrals: number;
  conversionRate: number;
  totalMrrFromReferrals: number;
  bySourceType: Record<string, { count: number; converted: number; mrr: number }>;
  computedAt: string;
}

export async function getReferralSummary(organizationId?: string): Promise<ReferralSummary> {
  const supabase = createServiceClient();
  if (!supabase) {
    return {
      totalReferrals: 0, convertedReferrals: 0, conversionRate: 0,
      totalMrrFromReferrals: 0, bySourceType: {}, computedAt: new Date().toISOString()
    };
  }

  const query = supabase.from("referral_flywheel_events").select("*");
  const { data } = organizationId
    ? await query.eq("organization_id", organizationId)
    : await query.limit(200);

  const records = data ?? [];
  const converted = records.filter(r => r.advocacy_stage === "converted");
  const bySourceType: Record<string, { count: number; converted: number; mrr: number }> = {};

  for (const r of records) {
    const src = r.referral_source ?? "customer";
    if (!bySourceType[src]) bySourceType[src] = { count: 0, converted: 0, mrr: 0 };
    bySourceType[src].count += 1;
    if (r.advocacy_stage === "converted") {
      bySourceType[src].converted += 1;
    }
  }

  return {
    totalReferrals: records.length,
    convertedReferrals: converted.length,
    conversionRate: records.length > 0 ? Math.round((converted.length / records.length) * 100) : 0,
    totalMrrFromReferrals: 0,
    bySourceType,
    computedAt: new Date().toISOString(),
  };
}
