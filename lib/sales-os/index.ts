import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface SalesDashboard {
  leads: {
    total: number;
    newThisMonth: number;
    qualifiedCount: number;
    bookedCount: number;
    wonCount: number;
    lostCount: number;
  };
  topProspects: Array<{
    id: string;
    practiceName: string;
    contactName: string;
    stage: string;
    estimatedMrr: number;
    leadScore: number;
  }>;
  generatedAt: string;
}

export interface ProposalStatus {
  leadId: string;
  practiceName: string;
  proposalSentAt: string | null;
  followUpCount: number;
  lastContactAt: string | null;
  bookingStatus: string | null;
}

/**
 * getSalesDashboard — aggregates lead metrics scoped to the given organization.
 * organizationId is required — all queries are tenant-scoped (GAP-003 fix).
 */
export async function getSalesDashboard(organizationId: string): Promise<SalesDashboard> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  let leads = { total: 0, newThisMonth: 0, qualifiedCount: 0, bookedCount: 0, wonCount: 0, lostCount: 0 };
  let topProspects: SalesDashboard["topProspects"] = [];

  if (supabase && organizationId) {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [allLeads, prospects] = await Promise.all([
      supabase.from("leads").select("status, created_at").eq("organization_id", organizationId).limit(500),
      supabase.from("leads").select("id, practice_name, dentist_name, status, no_show_rate").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(10),
    ]);

    const leadData = allLeads.data ?? [];
    leads = {
      total: leadData.length,
      newThisMonth: leadData.filter(l => (l.created_at ?? "") >= monthStart).length,
      qualifiedCount: leadData.filter(l => l.status === "qualified").length,
      bookedCount: leadData.filter(l => l.status === "booked").length,
      wonCount: leadData.filter(l => l.status === "won").length,
      lostCount: leadData.filter(l => l.status === "lost").length,
    };

    topProspects = (prospects.data ?? []).map(p => ({
      id: p.id,
      practiceName: p.practice_name ?? "",
      contactName: p.dentist_name ?? "",
      stage: p.status ?? "lead_captured",
      estimatedMrr: 299,
      leadScore: 50,
    }));
  }

  return {
    leads,
    topProspects,
    generatedAt: now,
  };
}

/**
 * getProposalStatuses — returns proposal/outreach status for each booked lead,
 * scoped to the given organization (GAP-003 fix).
 */
export async function getProposalStatuses(organizationId: string): Promise<ProposalStatus[]> {
  const supabase = createServiceClient();
  if (!supabase || !organizationId) return [];

  const { data: leads } = await supabase
    .from("leads")
    .select("id, practice_name, status")
    .eq("organization_id", organizationId)
    .in("status", ["booked", "qualified"])
    .limit(50);

  if (!leads || leads.length === 0) return [];

  const leadIds = leads.map(l => l.id);

  const [bookings, events] = await Promise.all([
    supabase.from("bookings").select("lead_id, booking_status, created_at").in("lead_id", leadIds),
    supabase.from("outreach_events").select("lead_id, event_type, created_at").in("lead_id", leadIds).order("created_at", { ascending: false }),
  ]);

  return leads.map(l => {
    const booking = (bookings.data ?? []).find(b => b.lead_id === l.id);
    const leadEvents = (events.data ?? []).filter(e => e.lead_id === l.id);
    const emailEvents = leadEvents.filter(e => e.event_type === "email_sent");

    return {
      leadId: l.id,
      practiceName: l.practice_name ?? "",
      proposalSentAt: emailEvents[0]?.created_at ?? null,
      followUpCount: emailEvents.length,
      lastContactAt: leadEvents[0]?.created_at ?? null,
      bookingStatus: booking?.booking_status ?? null,
    };
  });
}

/**
 * getSalesMetrics — key performance indicators for sales operations,
 * scoped to the given organization.
 */
export async function getSalesMetrics(organizationId: string) {
  const dashboard = await getSalesDashboard(organizationId);
  return {
    totalLeads: dashboard.leads.total,
    newLeadsThisMonth: dashboard.leads.newThisMonth,
    wonCount: dashboard.leads.wonCount,
    lostCount: dashboard.leads.lostCount,
    winRate: dashboard.leads.total > 0
      ? Math.round((dashboard.leads.wonCount / dashboard.leads.total) * 100 * 10) / 10
      : 0,
    generatedAt: dashboard.generatedAt,
  };
}
