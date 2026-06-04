import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PracticeTwinState = {
  organizationId: string;
  currentState: {
    activePatients: number;
    scheduledPatients: number;
    overdueRecall: number;
    unscheduledTreatment: number;
    reviewPerformance: { totalReviews: number; avgRating: number; recentCount: number };
    referralPerformance: { totalReferrals: number; recentCount: number };
    revenueMetrics: { openOpportunities: number; totalOpportunityValue: number; mtdRevenue: number };
  };
  forecastState: {
    revenueForecast30d: number;
    revenueForecast90d: number;
    growthForecast: number;
    recallForecast: number;
  };
  snapshotDate: string;
  confidence: number;
};

export type RevenueTwinSimulation = {
  organizationId: string;
  simulationType: string;
  inputParameters: {
    recallImprovementPct?: number;
    noShowReductionPct?: number;
    treatmentAcceptanceIncreasePct?: number;
    reviewGrowthPct?: number;
    referralGrowthPct?: number;
  };
  projectedImpact: {
    additionalMonthlyRevenue: number;
    additionalAnnualRevenue: number;
    roiMultiple: number;
    confidenceScore: number;
  };
};

export type ForecastTwinResult = {
  organizationId: string;
  horizon30d: number;
  horizon90d: number;
  horizon180d: number;
  horizon365d: number;
  confidenceDecay: { d30: number; d90: number; d180: number; d365: number };
  forecastDate: string;
};

// ---------------------------------------------------------------------------
// getPracticeTwin
// ---------------------------------------------------------------------------

export async function getPracticeTwin(organizationId: string): Promise<PracticeTwinState> {
  const supabase = createServiceClient();
  const snapshotDate = new Date().toISOString().split("T")[0];

  let overdueRecall = 0;
  let scheduledPatients = 0;
  let unscheduledTreatment = 0;
  let totalReviews = 0;
  let avgRating = 0;
  let recentReviews = 0;
  let totalReferrals = 0;
  let recentReferrals = 0;
  let openOpportunities = 0;
  let totalOpportunityValue = 0;
  let mtdRevenue = 0;
  let revenueForecast30d = 0;
  let revenueForecast90d = 0;

  if (supabase) {
    const mtdStart = new Date();
    mtdStart.setDate(1);
    const mtdStartStr = mtdStart.toISOString().split("T")[0];

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      recallOverdueResult,
      recallScheduledResult,
      treatmentResult,
      reputationResult,
      referralResult,
      opportunitiesResult,
      attributionResult,
      forecast30Result,
      forecast90Result,
    ] = await Promise.all([
      (supabase as any)
        .from("recall_tracking")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "overdue"),
      (supabase as any)
        .from("recall_tracking")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .in("status", ["scheduled", "pending"]),
      (supabase as any)
        .from("treatment_acceptance_predictions")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .lt("acceptance_probability", 0.5),
      (supabase as any)
        .from("reputation_events")
        .select("rating, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(500)
        .then((r: any) => r)
        .catch(() => ({ data: null, error: null })),
      (supabase as any)
        .from("referral_tracking")
        .select("id, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(500)
        .then((r: any) => r)
        .catch(() => ({ data: null, error: null })),
      (supabase as any)
        .from("revenue_opportunities")
        .select("estimated_value")
        .eq("organization_id", organizationId)
        .eq("status", "open"),
      (supabase as any)
        .from("revenue_attribution_records")
        .select("amount")
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
      (supabase as any)
        .from("revenue_forecasts")
        .select("forecasted_amount")
        .eq("organization_id", organizationId)
        .eq("horizon_days", 90)
        .eq("forecast_type", "total")
        .order("forecast_date", { ascending: false })
        .limit(1),
    ]);

    overdueRecall = recallOverdueResult.count ?? 0;
    scheduledPatients = recallScheduledResult.count ?? 0;
    unscheduledTreatment = treatmentResult.count ?? 0;

    // Reputation events
    const reputationRows: any[] = reputationResult?.data ?? [];
    totalReviews = reputationRows.length;
    if (totalReviews > 0) {
      const ratingSum = reputationRows.reduce((s: number, r: any) => s + Number(r.rating ?? 0), 0);
      avgRating = Math.round((ratingSum / totalReviews) * 10) / 10;
      recentReviews = reputationRows.filter(
        (r: any) => r.created_at && r.created_at >= thirtyDaysAgo
      ).length;
    }

    // Referral tracking
    const referralRows: any[] = referralResult?.data ?? [];
    totalReferrals = referralRows.length;
    recentReferrals = referralRows.filter(
      (r: any) => r.created_at && r.created_at >= thirtyDaysAgo
    ).length;

    // Revenue opportunities
    const oppRows: any[] = opportunitiesResult?.data ?? [];
    openOpportunities = oppRows.length;
    totalOpportunityValue = oppRows.reduce(
      (s: number, r: any) => s + Number(r.estimated_value ?? 0),
      0
    );

    // MTD revenue
    const attrRows: any[] = attributionResult?.data ?? [];
    mtdRevenue = attrRows.reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);

    // Forecasts
    const f30Rows: any[] = forecast30Result?.data ?? [];
    if (f30Rows.length > 0) revenueForecast30d = Number(f30Rows[0].forecasted_amount ?? 0);

    const f90Rows: any[] = forecast90Result?.data ?? [];
    if (f90Rows.length > 0) revenueForecast90d = Number(f90Rows[0].forecasted_amount ?? 0);
  }

  const growthForecast =
    revenueForecast30d > 0 && revenueForecast90d > 0
      ? Math.round(((revenueForecast90d - revenueForecast30d * 3) / (revenueForecast30d * 3)) * 100)
      : 0;

  const recallForecast = scheduledPatients * 300;

  const state: PracticeTwinState = {
    organizationId,
    currentState: {
      activePatients: scheduledPatients,
      scheduledPatients,
      overdueRecall,
      unscheduledTreatment,
      reviewPerformance: { totalReviews, avgRating, recentCount: recentReviews },
      referralPerformance: { totalReferrals, recentCount: recentReferrals },
      revenueMetrics: { openOpportunities, totalOpportunityValue, mtdRevenue },
    },
    forecastState: {
      revenueForecast30d,
      revenueForecast90d,
      growthForecast,
      recallForecast,
    },
    snapshotDate,
    confidence: 0.78,
  };

  // Upsert snapshot (non-blocking)
  if (supabase) {
    (async () => {
      try {
        await (supabase as any).from("digital_twin_snapshots").upsert(
          {
            organization_id: organizationId,
            twin_type: "practice",
            snapshot_date: snapshotDate,
            snapshot_data: state as unknown as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "organization_id,twin_type,snapshot_date" }
        );
      } catch {}
    })();
  }

  // Emit event (non-blocking)
  (async () => {
    try {
      await publishRuntimeFabricEvent({
        eventKey: "digital_twin_updated",
        eventType: "agent",
        sourceSystem: "digital_twin_os",
        targetChannel: "mission_control",
        priority: "low",
        summary: `Practice twin updated for ${organizationId}`,
        payload: { organizationId, snapshotDate, twinType: "practice" },
      });
    } catch {}
  })();

  return state;
}

// ---------------------------------------------------------------------------
// simulateRevenueTwin
// ---------------------------------------------------------------------------

export async function simulateRevenueTwin(
  organizationId: string,
  inputs: RevenueTwinSimulation["inputParameters"]
): Promise<RevenueTwinSimulation> {
  const supabase = createServiceClient();

  let baselineOpportunityValue = 0;
  let overdueRecallCount = 0;
  let openOpportunityCount = 0;

  if (supabase) {
    const [oppResult, recallResult] = await Promise.all([
      (supabase as any)
        .from("revenue_opportunities")
        .select("estimated_value")
        .eq("organization_id", organizationId)
        .eq("status", "open"),
      (supabase as any)
        .from("recall_tracking")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "overdue"),
    ]);

    const oppRows: any[] = oppResult?.data ?? [];
    baselineOpportunityValue = oppRows.reduce(
      (s: number, r: any) => s + Number(r.estimated_value ?? 0),
      0
    );
    openOpportunityCount = oppRows.length;
    overdueRecallCount = recallResult?.count ?? 0;
  }

  let additionalMonthlyRevenue = 0;

  // Recall improvement lever
  if (inputs.recallImprovementPct && inputs.recallImprovementPct > 0) {
    const pct = inputs.recallImprovementPct;
    additionalMonthlyRevenue += 300 * (overdueRecallCount * 0.1 * (pct / 10));
  }

  // No-show reduction lever
  if (inputs.noShowReductionPct && inputs.noShowReductionPct > 0) {
    const estimatedNoShows = Math.max(5, Math.round(openOpportunityCount * 0.08));
    additionalMonthlyRevenue += 200 * estimatedNoShows * (inputs.noShowReductionPct / 100);
  }

  // Treatment acceptance increase lever
  if (inputs.treatmentAcceptanceIncreasePct && inputs.treatmentAcceptanceIncreasePct > 0) {
    additionalMonthlyRevenue +=
      baselineOpportunityValue * (inputs.treatmentAcceptanceIncreasePct / 100);
  }

  // Review growth lever (reviews influence ~5% of new patients at avg $1500)
  if (inputs.reviewGrowthPct && inputs.reviewGrowthPct > 0) {
    const estimatedNewPatientsFromReviews = Math.max(2, Math.round(openOpportunityCount * 0.05));
    additionalMonthlyRevenue +=
      1500 * estimatedNewPatientsFromReviews * (inputs.reviewGrowthPct / 100);
  }

  // Referral growth lever (each referral converts at avg $1200)
  if (inputs.referralGrowthPct && inputs.referralGrowthPct > 0) {
    const estimatedReferrals = Math.max(1, Math.round(openOpportunityCount * 0.03));
    additionalMonthlyRevenue += 1200 * estimatedReferrals * (inputs.referralGrowthPct / 100);
  }

  additionalMonthlyRevenue = Math.round(additionalMonthlyRevenue);
  const additionalAnnualRevenue = additionalMonthlyRevenue * 12;
  const roiMultiple = Math.round((additionalAnnualRevenue / 997) * 100) / 100;
  const confidenceScore = 0.65;

  const simulation: RevenueTwinSimulation = {
    organizationId,
    simulationType: "revenue_improvement",
    inputParameters: inputs,
    projectedImpact: {
      additionalMonthlyRevenue,
      additionalAnnualRevenue,
      roiMultiple,
      confidenceScore,
    },
  };

  // Persist simulation (non-blocking)
  if (supabase) {
    (async () => {
      try {
        await (supabase as any).from("digital_twin_simulations").insert({
          organization_id: organizationId,
          simulation_type: simulation.simulationType,
          input_parameters: inputs as unknown as Record<string, unknown>,
          projected_impact: simulation.projectedImpact as unknown as Record<string, unknown>,
          confidence_score: confidenceScore,
          created_at: new Date().toISOString(),
        });
      } catch {}
    })();
  }

  return simulation;
}

// ---------------------------------------------------------------------------
// getForecastTwin
// ---------------------------------------------------------------------------

export async function getForecastTwin(organizationId: string): Promise<ForecastTwinResult> {
  const supabase = createServiceClient();
  const forecastDate = new Date().toISOString().split("T")[0];

  const DECAY: Record<number, number> = { 30: 0.9, 90: 0.7, 180: 0.6, 365: 0.5 };

  let horizon30d = 0;
  let horizon90d = 0;
  let horizon180d = 0;
  let horizon365d = 0;

  if (supabase) {
    const [f30, f90, f180, f365, oppResult] = await Promise.all([
      (supabase as any)
        .from("revenue_forecasts")
        .select("forecasted_amount")
        .eq("organization_id", organizationId)
        .eq("horizon_days", 30)
        .eq("forecast_type", "total")
        .order("forecast_date", { ascending: false })
        .limit(1),
      (supabase as any)
        .from("revenue_forecasts")
        .select("forecasted_amount")
        .eq("organization_id", organizationId)
        .eq("horizon_days", 90)
        .eq("forecast_type", "total")
        .order("forecast_date", { ascending: false })
        .limit(1),
      (supabase as any)
        .from("revenue_forecasts")
        .select("forecasted_amount")
        .eq("organization_id", organizationId)
        .eq("horizon_days", 180)
        .eq("forecast_type", "total")
        .order("forecast_date", { ascending: false })
        .limit(1),
      (supabase as any)
        .from("revenue_forecasts")
        .select("forecasted_amount")
        .eq("organization_id", organizationId)
        .eq("horizon_days", 365)
        .eq("forecast_type", "total")
        .order("forecast_date", { ascending: false })
        .limit(1),
      (supabase as any)
        .from("revenue_opportunities")
        .select("estimated_value, opportunity_score")
        .eq("organization_id", organizationId)
        .eq("status", "open"),
    ]);

    // Compute base from open opportunities for fallback
    const oppRows: any[] = oppResult?.data ?? [];
    const baseOppValue = oppRows.reduce(
      (s: number, r: any) =>
        s + Number(r.estimated_value ?? 0) * (Number(r.opportunity_score ?? 50) / 100),
      0
    );

    const getVal = (result: any, horizonDays: number): number => {
      const rows: any[] = result?.data ?? [];
      if (rows.length > 0) return Number(rows[0].forecasted_amount ?? 0);
      // Fallback: compute from opportunities with decay
      return Math.round(baseOppValue * DECAY[horizonDays]);
    };

    horizon30d = getVal(f30, 30);
    horizon90d = getVal(f90, 90);
    horizon180d = getVal(f180, 180);
    horizon365d = getVal(f365, 365);
  }

  const result: ForecastTwinResult = {
    organizationId,
    horizon30d,
    horizon90d,
    horizon180d,
    horizon365d,
    confidenceDecay: { d30: DECAY[30], d90: DECAY[90], d180: DECAY[180], d365: DECAY[365] },
    forecastDate,
  };

  // Upsert snapshot (non-blocking)
  if (supabase) {
    (async () => {
      try {
        await (supabase as any).from("digital_twin_snapshots").upsert(
          {
            organization_id: organizationId,
            twin_type: "forecast",
            snapshot_date: forecastDate,
            snapshot_data: result as unknown as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "organization_id,twin_type,snapshot_date" }
        );
      } catch {}
    })();
  }

  return result;
}

// ---------------------------------------------------------------------------
// getPatientTwinScores
// ---------------------------------------------------------------------------

export async function getPatientTwinScores(
  organizationId: string,
  patientExternalId: string
): Promise<{
  engagementScore: number;
  retentionScore: number;
  reviewProbability: number;
  referralProbability: number;
  treatmentAcceptanceProbability: number;
}> {
  const supabase = createServiceClient();
  const defaults = {
    engagementScore: 50,
    retentionScore: 50,
    reviewProbability: 30,
    referralProbability: 20,
    treatmentAcceptanceProbability: 50,
  };

  if (!supabase) return defaults;

  const { data } = await (supabase as any)
    .from("patient_influence_scores")
    .select(
      "engagement_score, loyalty_score, review_probability_score, referral_probability_score, treatment_intent_score"
    )
    .eq("organization_id", organizationId)
    .eq("patient_external_id", patientExternalId)
    .limit(1)
    .maybeSingle();

  if (!data) return defaults;

  return {
    engagementScore: Number(data.engagement_score ?? defaults.engagementScore),
    retentionScore: Number(data.loyalty_score ?? defaults.retentionScore),
    reviewProbability: Number(data.review_probability_score ?? defaults.reviewProbability),
    referralProbability: Number(data.referral_probability_score ?? defaults.referralProbability),
    treatmentAcceptanceProbability: Number(
      data.treatment_intent_score ?? defaults.treatmentAcceptanceProbability
    ),
  };
}

// ---------------------------------------------------------------------------
// getWorkflowTwin
// ---------------------------------------------------------------------------

export async function getWorkflowTwin(organizationId: string): Promise<{
  workflowHealth: number;
  activeWorkflows: number;
  failedWorkflows: number;
  reliabilityScore: number;
}> {
  const supabase = createServiceClient();
  const defaults = { workflowHealth: 100, activeWorkflows: 0, failedWorkflows: 0, reliabilityScore: 100 };

  if (!supabase) return defaults;

  // Try workflow_recovery_metrics first
  const { data: metricsData } = await (supabase as any)
    .from("workflow_recovery_metrics")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
    .catch(() => ({ data: null }));

  if (metricsData) {
    return {
      workflowHealth: Number(metricsData.health_score ?? metricsData.workflow_health ?? 100),
      activeWorkflows: Number(metricsData.active_workflows ?? 0),
      failedWorkflows: Number(metricsData.failed_workflows ?? 0),
      reliabilityScore: Number(metricsData.reliability_score ?? 100),
    };
  }

  // Fallback: compute from workflow_recovery_events for past 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: eventsData } = await (supabase as any)
    .from("workflow_recovery_events")
    .select("status, event_type")
    .eq("organization_id", organizationId)
    .gte("created_at", sevenDaysAgo)
    .catch(() => ({ data: null }));

  const events: any[] = eventsData ?? [];
  if (events.length === 0) return defaults;

  const failed = events.filter(
    (e: any) => e.status === "failed" || e.event_type === "failure"
  ).length;
  const active = events.filter(
    (e: any) => e.status === "active" || e.status === "running"
  ).length;
  const reliabilityScore =
    events.length > 0 ? Math.round(((events.length - failed) / events.length) * 100) : 100;
  const workflowHealth = reliabilityScore;

  return {
    workflowHealth,
    activeWorkflows: active,
    failedWorkflows: failed,
    reliabilityScore,
  };
}

// ---------------------------------------------------------------------------
// getDigitalTwinDashboard
// ---------------------------------------------------------------------------

export async function getDigitalTwinDashboard(organizationId: string): Promise<{
  practice: PracticeTwinState;
  forecast: ForecastTwinResult;
  workflowHealth: number;
  lastUpdated: string;
}> {
  const [practice, forecast, workflowTwin] = await Promise.all([
    getPracticeTwin(organizationId),
    getForecastTwin(organizationId),
    getWorkflowTwin(organizationId),
  ]);

  return {
    practice,
    forecast,
    workflowHealth: workflowTwin.workflowHealth,
    lastUpdated: new Date().toISOString(),
  };
}
