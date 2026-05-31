import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { getPipelineSummary, getRevenueForecast } from "@/lib/revenue-os";

export interface SalesDashboard {
  pipeline: {
    totalDeals: number;
    totalPipelineValue: number;
    weightedForecast: number;
    closedWonMrr: number;
    closedWonArr: number;
  };
  forecast: {
    currentMrr: number;
    forecastMrr90Days: number;
    netNewMrr: number;
    churnRiskMrr: number;
  };
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
 * getSalesDashboard — aggregates pipeline, forecast, and lead metrics.
 */
export async function getSalesDashboard(): Promise<SalesDashboard> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const [pipeline, forecast] = await Promise.all([
    getPipelineSummary(),
    getRevenueForecast(),
  ]);

  let leads = { total: 0, newThisMonth: 0, qualifiedCount: 0, bookedCount: 0, wonCount: 0, lostCount: 0 };
  let topProspects: SalesDashboard["topProspects"] = [];

  if (supabase) {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [allLeads, prospects] = await Promise.all([
      supabase.from("leads").select("status, created_at").limit(500),
      supabase.from("gtm_prospects").select("id, practice_name, contact_name, pipeline_stage, estimated_monthly_opportunity, lead_score").order("lead_score", { ascending: false }).limit(10),
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
      contactName: p.contact_name ?? "",
      stage: p.pipeline_stage ?? "discovery",
      estimatedMrr: p.estimated_monthly_opportunity ?? 0,
      leadScore: p.lead_score ?? 0,
    }));
  }

  return {
    pipeline: {
      totalDeals: pipeline.totalDeals,
      totalPipelineValue: pipeline.totalPipelineValue,
      weightedForecast: pipeline.weightedForecast,
      closedWonMrr: pipeline.closedWonMrr,
      closedWonArr: pipeline.closedWonArr,
    },
    forecast: {
      currentMrr: forecast.currentMrr,
      forecastMrr90Days: forecast.forecastMrr90Days,
      netNewMrr: forecast.netNewMrr,
      churnRiskMrr: forecast.churnRiskMrr,
    },
    leads,
    topProspects,
    generatedAt: now,
  };
}

/**
 * getProposalStatuses — returns proposal/outreach status for each booked lead.
 */
export async function getProposalStatuses(): Promise<ProposalStatus[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data: leads } = await supabase
    .from("leads")
    .select("id, practice_name, status")
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
 * getSalesMetrics — key performance indicators for sales operations.
 */
export async function getSalesMetrics() {
  const dashboard = await getSalesDashboard();
  return {
    totalPipelineValue: dashboard.pipeline.totalPipelineValue,
    closedWonMrr: dashboard.pipeline.closedWonMrr,
    forecastMrr90Days: dashboard.forecast.forecastMrr90Days,
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
