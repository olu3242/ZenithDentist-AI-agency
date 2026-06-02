import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

export type RevenueOpportunity = {
  id?: string;
  organizationId: string;
  patientExternalId: string;
  opportunityType:
    | "unscheduled_treatment"
    | "delayed_treatment"
    | "declined_treatment"
    | "recall"
    | "membership"
    | "referral"
    | "reactivation";
  procedureCode?: string;
  procedureDescription?: string;
  estimatedValue: number;
  opportunityScore: number; // 0-100
  status: "open" | "actioned" | "won" | "lost" | "expired";
  daysDelayed?: number;
};

export type RevenueForecast = {
  organizationId: string;
  forecastDate: string;
  horizonDays: 30 | 60 | 90 | 180 | 365;
  forecastType: "total" | "treatment" | "membership" | "recall" | "referral";
  forecastedAmount: number;
  confidenceLow: number;
  confidenceHigh: number;
};

export type RevenueOSSummary = {
  organizationId: string;
  totalOpenOpportunities: number;
  totalOpportunityValue: number;
  avgOpportunityScore: number;
  topOpportunityType: string;
  revenueAtRisk: number; // high-score opportunities not actioned > 14 days
  revenueInfluencedMtd: number;
  revenueRecoveredMtd: number;
  latestForecast30d?: number;
};

export async function createRevenueOpportunity(
  opportunity: RevenueOpportunity
): Promise<string> {
  const supabase = createServiceClient();
  const id = crypto.randomUUID();
  if (supabase) {
    const { data, error } = await (supabase as any)
      .from("revenue_opportunities")
      .insert({
        id,
        organization_id: opportunity.organizationId,
        patient_external_id: opportunity.patientExternalId,
        opportunity_type: opportunity.opportunityType,
        procedure_code: opportunity.procedureCode ?? null,
        procedure_description: opportunity.procedureDescription ?? null,
        estimated_value: opportunity.estimatedValue,
        opportunity_score: opportunity.opportunityScore,
        status: opportunity.status,
        days_delayed: opportunity.daysDelayed ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (!error && data) {
      (async () => {
        try {
          await publishRuntimeFabricEvent({
            eventKey: `revenue.opportunity.created.${data.id}`,
            eventType: "agent",
            sourceSystem: "revenue_os",
            targetChannel: "revenue_intelligence",
            priority:
              opportunity.opportunityScore >= 70 ? "high" : "moderate",
            summary: `Revenue opportunity created: ${opportunity.opportunityType} for patient ${opportunity.patientExternalId} ($${opportunity.estimatedValue})`,
            payload: {
              opportunityId: data.id,
              opportunityType: opportunity.opportunityType,
              estimatedValue: opportunity.estimatedValue,
              opportunityScore: opportunity.opportunityScore,
            },
          });
        } catch {}
      })();
      return data.id as string;
    }
  }
  return id;
}

export async function scanRevenueOpportunities(
  organizationId: string
): Promise<RevenueOpportunity[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const [recallResult, treatmentResult, membershipResult, existingResult, influenceResult] =
    await Promise.all([
      (supabase as any)
        .from("recall_tracking")
        .select(
          "patient_external_id, months_overdue, status"
        )
        .eq("organization_id", organizationId)
        .eq("status", "overdue"),
      (supabase as any)
        .from("treatment_acceptance_predictions")
        .select(
          "patient_external_id, acceptance_probability, estimated_revenue, procedure_type"
        )
        .eq("organization_id", organizationId)
        .lt("acceptance_probability", 0.5),
      (supabase as any)
        .from("membership_tracking")
        .select("patient_external_id, monthly_value, status")
        .eq("organization_id", organizationId)
        .eq("status", "expired"),
      (supabase as any)
        .from("revenue_opportunities")
        .select("patient_external_id, opportunity_type, id")
        .eq("organization_id", organizationId)
        .eq("status", "open"),
      (supabase as any)
        .from("patient_influence_scores")
        .select(
          "patient_external_id, treatment_intent_score, membership_conversion_score"
        )
        .eq("organization_id", organizationId),
    ]);

  const existingSet = new Set<string>(
    ((existingResult.data ?? []) as any[]).map(
      (r: any) => `${r.patient_external_id}:${r.opportunity_type}`
    )
  );

  const influenceMap: Record<
    string,
    { intent: number; membershipScore: number }
  > = {};
  for (const row of (influenceResult.data ?? []) as any[]) {
    influenceMap[row.patient_external_id as string] = {
      intent: Number(row.treatment_intent_score ?? 50),
      membershipScore: Number(row.membership_conversion_score ?? 50),
    };
  }

  const opportunities: RevenueOpportunity[] = [];

  // Recall opportunities
  for (const row of (recallResult.data ?? []) as any[]) {
    const key = `${row.patient_external_id}:recall`;
    if (existingSet.has(key)) continue;
    const monthsOverdue = Number(row.months_overdue ?? 1);
    const score = Math.min(80, Math.round((monthsOverdue / 12) * 40 + 40));
    opportunities.push({
      organizationId,
      patientExternalId: row.patient_external_id as string,
      opportunityType: "recall",
      estimatedValue: 300,
      opportunityScore: score,
      status: "open",
    });
  }

  // Delayed treatment opportunities
  for (const row of (treatmentResult.data ?? []) as any[]) {
    const key = `${row.patient_external_id}:delayed_treatment`;
    if (existingSet.has(key)) continue;
    const estimatedValue = Number(row.estimated_revenue ?? 1000);
    const intentScore = influenceMap[row.patient_external_id as string]?.intent ?? 50;
    const score = Math.min(
      100,
      Math.round((estimatedValue / 5000) * 50 + intentScore)
    );
    opportunities.push({
      organizationId,
      patientExternalId: row.patient_external_id as string,
      opportunityType: "delayed_treatment",
      procedureDescription: row.procedure_type as string | undefined,
      estimatedValue,
      opportunityScore: score,
      status: "open",
    });
  }

  // Membership opportunities
  for (const row of (membershipResult.data ?? []) as any[]) {
    const key = `${row.patient_external_id}:membership`;
    if (existingSet.has(key)) continue;
    const membershipScore =
      influenceMap[row.patient_external_id as string]?.membershipScore ?? 50;
    const score = Math.min(100, Math.round(membershipScore));
    const monthlyValue = Number(row.monthly_value ?? 50);
    opportunities.push({
      organizationId,
      patientExternalId: row.patient_external_id as string,
      opportunityType: "membership",
      estimatedValue: monthlyValue * 12,
      opportunityScore: score,
      status: "open",
    });
  }

  // Upsert new opportunities
  if (opportunities.length > 0) {
    (async () => {
      try {
        await (supabase as any).from("revenue_opportunities").upsert(
          opportunities.map((o) => ({
            organization_id: o.organizationId,
            patient_external_id: o.patientExternalId,
            opportunity_type: o.opportunityType,
            procedure_description: o.procedureDescription ?? null,
            estimated_value: o.estimatedValue,
            opportunity_score: o.opportunityScore,
            status: o.status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })),
          { onConflict: "organization_id,patient_external_id,opportunity_type" }
        );
      } catch {}
    })();
  }

  return opportunities;
}

export async function getOpenOpportunities(
  organizationId: string,
  minScore?: number
): Promise<RevenueOpportunity[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  let query = (supabase as any)
    .from("revenue_opportunities")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", "open")
    .order("opportunity_score", { ascending: false })
    .order("estimated_value", { ascending: false });

  if (minScore !== undefined) {
    query = query.gte("opportunity_score", minScore);
  }

  const { data } = await query;
  return ((data ?? []) as any[]).map((r: any) => ({
    id: r.id as string,
    organizationId: r.organization_id as string,
    patientExternalId: r.patient_external_id as string,
    opportunityType: r.opportunity_type as RevenueOpportunity["opportunityType"],
    procedureCode: r.procedure_code as string | undefined,
    procedureDescription: r.procedure_description as string | undefined,
    estimatedValue: Number(r.estimated_value ?? 0),
    opportunityScore: Number(r.opportunity_score ?? 0),
    status: r.status as RevenueOpportunity["status"],
    daysDelayed: r.days_delayed as number | undefined,
  }));
}

export async function markOpportunityWon(
  organizationId: string,
  opportunityId: string,
  revenueRealized: number
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;
  await (supabase as any)
    .from("revenue_opportunities")
    .update({
      status: "won",
      won_at: new Date().toISOString(),
      revenue_realized: revenueRealized,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId)
    .eq("id", opportunityId);
}

export async function markOpportunityLost(
  organizationId: string,
  opportunityId: string
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;
  await (supabase as any)
    .from("revenue_opportunities")
    .update({ status: "lost", updated_at: new Date().toISOString() })
    .eq("organization_id", organizationId)
    .eq("id", opportunityId);
}

export async function forecastRevenue(
  organizationId: string,
  horizonDays: 30 | 60 | 90 | 180 | 365
): Promise<RevenueForecast> {
  const supabase = createServiceClient();
  const forecastDate = new Date().toISOString().split("T")[0];

  const confidenceDecay: Record<number, number> = {
    30: 0.9,
    60: 0.8,
    90: 0.7,
    180: 0.6,
    365: 0.5,
  };

  let opportunityContribution = 0;
  let membershipContribution = 0;
  let recallContribution = 0;

  if (supabase) {
    const [opportunityResult, membershipResult, recallResult] =
      await Promise.all([
        (supabase as any)
          .from("revenue_opportunities")
          .select("estimated_value, opportunity_score")
          .eq("organization_id", organizationId)
          .eq("status", "open")
          .gte("opportunity_score", 60),
        (supabase as any)
          .from("membership_tracking")
          .select("monthly_value")
          .eq("organization_id", organizationId)
          .eq("status", "active"),
        (supabase as any)
          .from("recall_tracking")
          .select("id")
          .eq("organization_id", organizationId)
          .eq("status", "scheduled"),
      ]);

    opportunityContribution = ((opportunityResult.data ?? []) as any[]).reduce(
      (sum: number, r: any) =>
        sum + Number(r.estimated_value ?? 0) * (Number(r.opportunity_score ?? 0) / 100),
      0
    );

    membershipContribution = ((membershipResult.data ?? []) as any[]).reduce(
      (sum: number, r: any) =>
        sum + Number(r.monthly_value ?? 0) * (horizonDays / 30),
      0
    );

    const recallScheduledCount = ((recallResult.data ?? []) as any[]).length;
    recallContribution = recallScheduledCount * 300;
  }

  const rawTotal =
    opportunityContribution + membershipContribution + recallContribution;
  const decay = confidenceDecay[horizonDays] ?? 0.7;
  const forecastedAmount = Math.round(rawTotal * decay);

  const forecast: RevenueForecast = {
    organizationId,
    forecastDate,
    horizonDays,
    forecastType: "total",
    forecastedAmount,
    confidenceLow: Math.round(forecastedAmount * 0.7),
    confidenceHigh: Math.round(forecastedAmount * 1.3),
  };

  if (supabase) {
    (async () => {
      try {
        await (supabase as any).from("revenue_forecasts").upsert(
          {
            organization_id: organizationId,
            forecast_date: forecastDate,
            horizon_days: horizonDays,
            forecast_type: "total",
            forecasted_amount: forecastedAmount,
            confidence_low: forecast.confidenceLow,
            confidence_high: forecast.confidenceHigh,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "organization_id,forecast_date,horizon_days,forecast_type" }
        );
      } catch {}
    })();
  }

  return forecast;
}

export async function getRevenueSummary(
  organizationId: string
): Promise<RevenueOSSummary> {
  const supabase = createServiceClient();

  let totalOpenOpportunities = 0;
  let totalOpportunityValue = 0;
  let avgOpportunityScore = 0;
  let topOpportunityType = "unscheduled_treatment";
  let revenueAtRisk = 0;
  let revenueInfluencedMtd = 0;
  let revenueRecoveredMtd = 0;
  let latestForecast30d: number | undefined;

  if (supabase) {
    const mtdStart = new Date();
    mtdStart.setDate(1);
    const mtdStartStr = mtdStart.toISOString().split("T")[0];
    const atRiskCutoff = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000
    ).toISOString();

    const [openResult, atRiskResult, attributionResult, forecastResult] =
      await Promise.all([
        (supabase as any)
          .from("revenue_opportunities")
          .select("estimated_value, opportunity_score, opportunity_type")
          .eq("organization_id", organizationId)
          .eq("status", "open"),
        (supabase as any)
          .from("revenue_opportunities")
          .select("estimated_value")
          .eq("organization_id", organizationId)
          .eq("status", "open")
          .gte("opportunity_score", 70)
          .lt("created_at", atRiskCutoff),
        (supabase as any)
          .from("revenue_attribution_records")
          .select("attributed_amount, attribution_type")
          .eq("organization_id", organizationId)
          .gte("created_at", `${mtdStartStr}T00:00:00Z`),
        (supabase as any)
          .from("revenue_forecasts")
          .select("forecasted_amount")
          .eq("organization_id", organizationId)
          .eq("horizon_days", 30)
          .eq("forecast_type", "total")
          .order("forecast_date", { ascending: false })
          .limit(1),
      ]);

    const openRows: any[] = openResult.data ?? [];
    totalOpenOpportunities = openRows.length;
    totalOpportunityValue = openRows.reduce(
      (sum: number, r: any) => sum + Number(r.estimated_value ?? 0),
      0
    );
    const scoreSum = openRows.reduce(
      (sum: number, r: any) => sum + Number(r.opportunity_score ?? 0),
      0
    );
    avgOpportunityScore =
      openRows.length > 0 ? Math.round(scoreSum / openRows.length) : 0;

    // Top opportunity type by count
    const typeCounts: Record<string, number> = {};
    for (const r of openRows) {
      const t = r.opportunity_type as string;
      typeCounts[t] = (typeCounts[t] ?? 0) + 1;
    }
    const topEntry = Object.entries(typeCounts).sort(
      ([, a], [, b]) => b - a
    )[0];
    if (topEntry) topOpportunityType = topEntry[0];

    revenueAtRisk = ((atRiskResult.data ?? []) as any[]).reduce(
      (sum: number, r: any) => sum + Number(r.estimated_value ?? 0),
      0
    );

    const attributionRows: any[] = attributionResult.data ?? [];
    revenueInfluencedMtd = attributionRows.reduce(
      (sum: number, r: any) => sum + Number(r.attributed_amount ?? 0),
      0
    );
    revenueRecoveredMtd = attributionRows
      .filter((r: any) => r.attribution_type === "recovered")
      .reduce((sum: number, r: any) => sum + Number(r.attributed_amount ?? 0), 0);

    const forecastRows: any[] = forecastResult.data ?? [];
    if (forecastRows.length > 0) {
      latestForecast30d = Number(forecastRows[0].forecasted_amount ?? 0);
    }
  }

  return {
    organizationId,
    totalOpenOpportunities,
    totalOpportunityValue,
    avgOpportunityScore,
    topOpportunityType,
    revenueAtRisk,
    revenueInfluencedMtd,
    revenueRecoveredMtd,
    latestForecast30d,
  };
}
