import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { advancePatientLifecycle } from "@/lib/patient-journey";
import { ExecutionEngine } from "@/packages/agent-os/execution/ExecutionEngine";
import { getAgentBySlug } from "@/packages/agent-os/router/AgentRegistry";
import { AgentRevenueAttributionStore } from "@/packages/agent-os/revenue/AgentRevenueAttributionStore";

// ---------------------------------------------------------------------------
// Treatment Visualization Journey — TVA domain module.
//
// Extends, rather than replaces:
//   - Agent OS (agent_registry / agent_executions / agent_revenue_attribution)
//     via ExecutionEngine + AgentRevenueAttributionStore
//   - Patient Journey Engine (lib/patient-journey) via advancePatientLifecycle
//   - Analytics (analytics_events) for education sent/viewed/accepted tracking
//
// New tables: treatment_visualizations, treatment_media (see migration
// 20260628000000_treatment_visualization_agent.sql).
// ---------------------------------------------------------------------------

export type TreatmentVisualizationStatus =
  | "pending"
  | "education_generated"
  | "education_sent"
  | "viewed"
  | "accepted"
  | "declined"
  | "failed";

export interface TreatmentVisualizationRecord {
  id: string;
  organization_id: string | null;
  patient_id: string;
  treatment_plan_id: string | null;
  treatment_code: string | null;
  treatment_value: number | null;
  agent_execution_id: string | null;
  status: TreatmentVisualizationStatus;
  engagement_score: number;
  expected_outcome: string | null;
  recovery_timeline: Array<{ day: string; milestone: string }>;
  faq: Array<{ question: string; answer: string }>;
  accepted_value: number | null;
  retry_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTreatmentVisualizationInput {
  organizationId: string;
  patientId: string;
  treatmentPlanId?: string;
  treatmentCode?: string;
  treatmentValue?: number;
}

export interface CreateTreatmentVisualizationResult {
  success: boolean;
  treatmentVisualizationId: string | null;
  status: TreatmentVisualizationStatus;
  error?: string;
}

function buildEducationContent(treatmentCode: string | undefined) {
  const label = treatmentCode ?? "your recommended treatment";
  return {
    overview: `Your care team has recommended ${label}. This overview explains what the procedure involves, why it was recommended, and what to expect at your visit.`,
    expectedOutcome: `Patients who complete ${label} typically report restored function, reduced pain, and improved long-term oral health outcomes.`,
    recoveryTimeline: [
      { day: "Day 0", milestone: "Procedure completed; initial recovery instructions provided." },
      { day: "Day 1-3", milestone: "Mild sensitivity expected; follow at-home care guidance." },
      { day: "Day 7", milestone: "Follow-up check to confirm healing is on track." },
      { day: "Day 30", milestone: "Full recovery expected; routine care resumes." }
    ],
    faq: [
      { question: "Will this hurt?", answer: "Local anesthesia is used; most patients report minimal discomfort." },
      { question: "How long does it take?", answer: "Most appointments for this treatment take 45-90 minutes." },
      { question: "What does it cost?", answer: "Your treatment coordinator will review financing and insurance coverage with you." }
    ]
  };
}

/**
 * Happy/failure/retry path entrypoint: generates and delivers treatment
 * education for a treatment plan, routed through Agent OS as the TVA agent.
 */
export async function createTreatmentVisualization(
  input: CreateTreatmentVisualizationInput
): Promise<CreateTreatmentVisualizationResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false, treatmentVisualizationId: null, status: "failed", error: "supabase_unavailable" };
  }

  const tva = await getAgentBySlug("tva");
  if (!tva) {
    return { success: false, treatmentVisualizationId: null, status: "failed", error: "tva_agent_not_registered" };
  }

  const { data: inserted, error: insertError } = await (supabase as any)
    .from("treatment_visualizations")
    .insert({
      organization_id: input.organizationId,
      patient_id: input.patientId,
      treatment_plan_id: input.treatmentPlanId ?? null,
      treatment_code: input.treatmentCode ?? null,
      treatment_value: input.treatmentValue ?? null,
      status: "pending"
    })
    .select("id")
    .maybeSingle();

  if (insertError || !inserted) {
    return { success: false, treatmentVisualizationId: null, status: "failed", error: insertError?.message ?? "insert_failed" };
  }

  const treatmentVisualizationId = inserted.id as string;

  const execution = await ExecutionEngine.run({
    agentId: tva.id,
    tenantId: input.organizationId,
    eventType: "treatment.visualization_required",
    workflowId: "treatment_visualization",
    payload: {
      treatmentVisualizationId,
      patientId: input.patientId,
      treatmentPlanId: input.treatmentPlanId,
      treatmentCode: input.treatmentCode
    }
  });

  if (!execution.success) {
    await (supabase as any)
      .from("treatment_visualizations")
      .update({
        status: "failed",
        retry_count: 1,
        last_error: execution.error ?? "execution_failed",
        agent_execution_id: null
      })
      .eq("id", treatmentVisualizationId);

    return {
      success: false,
      treatmentVisualizationId,
      status: "failed",
      error: execution.error ?? "execution_failed"
    };
  }

  const education = buildEducationContent(input.treatmentCode);

  await (supabase as any).from("treatment_media").insert([
    { treatment_visualization_id: treatmentVisualizationId, media_type: "overview", title: "Treatment Overview", body: education.overview, sequence: 0 },
    { treatment_visualization_id: treatmentVisualizationId, media_type: "expected_outcome", title: "Expected Outcome", body: education.expectedOutcome, sequence: 1 },
    {
      treatment_visualization_id: treatmentVisualizationId,
      media_type: "recovery_timeline",
      title: "Recovery Timeline",
      body: JSON.stringify(education.recoveryTimeline),
      sequence: 2
    },
    { treatment_visualization_id: treatmentVisualizationId, media_type: "faq", title: "Frequently Asked Questions", body: JSON.stringify(education.faq), sequence: 3 }
  ]);

  await (supabase as any)
    .from("treatment_visualizations")
    .update({
      status: "education_sent",
      expected_outcome: education.expectedOutcome,
      recovery_timeline: education.recoveryTimeline,
      faq: education.faq,
      agent_execution_id: execution.executionId,
      last_error: null
    })
    .eq("id", treatmentVisualizationId);

  await advancePatientLifecycle({
    patientId: input.patientId,
    organizationId: input.organizationId,
    fromState: "treatment_planned",
    toState: "treatment_visualization_pending",
    trigger: "treatment_visualization_education_sent",
    timestamp: new Date().toISOString(),
    metadata: { treatmentVisualizationId }
  }).catch(() => null);

  await trackTreatmentVisualizationEvent({
    organizationId: input.organizationId,
    treatmentVisualizationId,
    eventName: "education_sent",
    metadata: { treatmentCode: input.treatmentCode, treatmentValue: input.treatmentValue }
  });

  await AgentRevenueAttributionStore.recordAttribution({
    agentId: tva.id,
    executionId: execution.executionId,
    tenantId: input.organizationId,
    revenueType: "treatment_visualization_sent",
    revenueAmount: 0,
    sourceEvent: "treatment.visualization_education_sent"
  });

  return { success: true, treatmentVisualizationId, status: "education_sent" };
}

/** Retry path — re-runs generation/delivery for a previously failed visualization. */
export async function retryTreatmentVisualization(
  treatmentVisualizationId: string
): Promise<CreateTreatmentVisualizationResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false, treatmentVisualizationId, status: "failed", error: "supabase_unavailable" };
  }

  const { data: record, error } = await (supabase as any)
    .from("treatment_visualizations")
    .select("*")
    .eq("id", treatmentVisualizationId)
    .maybeSingle();

  if (error || !record) {
    return { success: false, treatmentVisualizationId, status: "failed", error: error?.message ?? "not_found" };
  }

  if (record.status !== "failed") {
    return { success: true, treatmentVisualizationId, status: record.status };
  }

  await (supabase as any)
    .from("treatment_visualizations")
    .update({ retry_count: (record.retry_count ?? 0) + 1 })
    .eq("id", treatmentVisualizationId);

  const result = await createTreatmentVisualization({
    organizationId: record.organization_id,
    patientId: record.patient_id,
    treatmentPlanId: record.treatment_plan_id ?? undefined,
    treatmentCode: record.treatment_code ?? undefined,
    treatmentValue: record.treatment_value ?? undefined
  });

  // The retry reuses createTreatmentVisualization's insert/execution path,
  // which creates a fresh row; supersede the original failed row so the
  // pipeline doesn't double-count it.
  if (result.success) {
    await (supabase as any)
      .from("treatment_visualizations")
      .update({ status: "declined", last_error: "superseded_by_retry" })
      .eq("id", treatmentVisualizationId);
  }

  return result;
}

export interface RecordEngagementInput {
  treatmentVisualizationId: string;
  engagementScore: number;
}

/** Patient Engagement step — patient viewed delivered treatment education. */
export async function recordEducationEngagement(input: RecordEngagementInput): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) return false;

  const { data: record } = await (supabase as any)
    .from("treatment_visualizations")
    .select("organization_id")
    .eq("id", input.treatmentVisualizationId)
    .maybeSingle();
  if (!record) return false;

  const { error } = await (supabase as any)
    .from("treatment_visualizations")
    .update({ status: "viewed", engagement_score: input.engagementScore })
    .eq("id", input.treatmentVisualizationId);
  if (error) return false;

  await trackTreatmentVisualizationEvent({
    organizationId: record.organization_id,
    treatmentVisualizationId: input.treatmentVisualizationId,
    eventName: "education_viewed",
    metadata: { engagementScore: input.engagementScore }
  });

  return true;
}

export interface RecordAcceptanceInput {
  treatmentVisualizationId: string;
  patientId: string;
  organizationId: string;
  acceptedValue: number;
}

/** Treatment step — patient accepted the treatment plan; attribute revenue. */
export async function recordTreatmentAcceptance(input: RecordAcceptanceInput): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) return false;

  const tva = await getAgentBySlug("tva");

  const { error } = await (supabase as any)
    .from("treatment_visualizations")
    .update({ status: "accepted", accepted_value: input.acceptedValue })
    .eq("id", input.treatmentVisualizationId);
  if (error) return false;

  await advancePatientLifecycle({
    patientId: input.patientId,
    organizationId: input.organizationId,
    fromState: "treatment_visualization_pending",
    toState: "treatment_accepted",
    trigger: "treatment_visualization_accepted",
    timestamp: new Date().toISOString(),
    metadata: { treatmentVisualizationId: input.treatmentVisualizationId }
  }).catch(() => null);

  await trackTreatmentVisualizationEvent({
    organizationId: input.organizationId,
    treatmentVisualizationId: input.treatmentVisualizationId,
    eventName: "treatment_accepted",
    metadata: { acceptedValue: input.acceptedValue }
  });

  await trackTreatmentVisualizationEvent({
    organizationId: input.organizationId,
    treatmentVisualizationId: input.treatmentVisualizationId,
    eventName: "revenue_generated",
    metadata: { acceptedValue: input.acceptedValue }
  });

  if (tva) {
    await AgentRevenueAttributionStore.recordAttribution({
      agentId: tva.id,
      tenantId: input.organizationId,
      revenueType: "treatment_visualization",
      revenueAmount: input.acceptedValue,
      attributionConfidence: 0.7,
      sourceEvent: "treatment.visualization_accepted"
    });
  }

  return true;
}

export async function recordTreatmentDecline(treatmentVisualizationId: string): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) return false;

  const { data: record } = await (supabase as any)
    .from("treatment_visualizations")
    .select("organization_id")
    .eq("id", treatmentVisualizationId)
    .maybeSingle();

  const { error } = await (supabase as any)
    .from("treatment_visualizations")
    .update({ status: "declined" })
    .eq("id", treatmentVisualizationId);
  if (error) return false;

  if (record?.organization_id) {
    await trackTreatmentVisualizationEvent({
      organizationId: record.organization_id,
      treatmentVisualizationId,
      eventName: "treatment_declined",
      metadata: {}
    });
  }

  return true;
}

// ---------------------------------------------------------------------------
// Analytics — reuses analytics_events (no new analytics table).
// ---------------------------------------------------------------------------

export type TreatmentVisualizationEventName =
  | "education_sent"
  | "education_viewed"
  | "treatment_accepted"
  | "treatment_declined"
  | "revenue_generated";

export async function trackTreatmentVisualizationEvent(input: {
  organizationId: string;
  treatmentVisualizationId: string;
  eventName: TreatmentVisualizationEventName;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  await (supabase as any).from("analytics_events").insert({
    organization_id: input.organizationId,
    event_name: `treatment_visualization.${input.eventName}`,
    destination: "internal",
    attribution: { agent: "tva", treatment_visualization_id: input.treatmentVisualizationId },
    metadata: input.metadata ?? {}
  });
}

// ---------------------------------------------------------------------------
// APS — Patient Education Readiness component (consumed by lib/growth-score)
// ---------------------------------------------------------------------------

export async function getPatientEducationReadinessScore(organizationId: string): Promise<number> {
  const supabase = createServiceClient();
  if (!supabase) return 0;

  const { data, error } = await (supabase as any)
    .from("treatment_visualizations")
    .select("engagement_score, status")
    .eq("organization_id", organizationId);

  if (error || !data || data.length === 0) return 0;

  const rows = data as Array<{ engagement_score: number; status: TreatmentVisualizationStatus }>;
  const viewedOrBeyond = rows.filter(r => ["viewed", "accepted", "declined"].includes(r.status));
  if (viewedOrBeyond.length === 0) return 0;

  const avgEngagement =
    viewedOrBeyond.reduce((sum, r) => sum + Number(r.engagement_score ?? 0), 0) / viewedOrBeyond.length;

  return Math.min(100, Math.round(avgEngagement));
}

// ---------------------------------------------------------------------------
// Mission Control — Education Pipeline / Acceptance Risk / Revenue Influence
// ---------------------------------------------------------------------------

export interface EducationPipelineSummary {
  pending: number;
  educationSent: number;
  viewed: number;
  accepted: number;
  declined: number;
  failed: number;
}

export async function getEducationPipeline(organizationId: string): Promise<EducationPipelineSummary> {
  const summary: EducationPipelineSummary = { pending: 0, educationSent: 0, viewed: 0, accepted: 0, declined: 0, failed: 0 };
  const supabase = createServiceClient();
  if (!supabase) return summary;

  const { data, error } = await (supabase as any)
    .from("treatment_visualizations")
    .select("status")
    .eq("organization_id", organizationId);
  if (error || !data) return summary;

  for (const row of data as Array<{ status: TreatmentVisualizationStatus }>) {
    if (row.status === "pending" || row.status === "education_generated") summary.pending += 1;
    else if (row.status === "education_sent") summary.educationSent += 1;
    else if (row.status === "viewed") summary.viewed += 1;
    else if (row.status === "accepted") summary.accepted += 1;
    else if (row.status === "declined") summary.declined += 1;
    else if (row.status === "failed") summary.failed += 1;
  }

  return summary;
}

export interface AcceptanceRiskSummary {
  atRiskCount: number;
  revenueAtRisk: number;
}

const LOW_ENGAGEMENT_THRESHOLD = 30;

/** Acceptance risk: education delivered/viewed but engagement is low — treatment value is at risk of non-acceptance. */
export async function getAcceptanceRisk(organizationId: string): Promise<AcceptanceRiskSummary> {
  const supabase = createServiceClient();
  if (!supabase) return { atRiskCount: 0, revenueAtRisk: 0 };

  const { data, error } = await (supabase as any)
    .from("treatment_visualizations")
    .select("treatment_value, engagement_score, status")
    .eq("organization_id", organizationId)
    .in("status", ["education_sent", "viewed"]);
  if (error || !data) return { atRiskCount: 0, revenueAtRisk: 0 };

  const atRisk = (data as Array<{ treatment_value: number | null; engagement_score: number }>).filter(
    r => Number(r.engagement_score ?? 0) < LOW_ENGAGEMENT_THRESHOLD
  );

  return {
    atRiskCount: atRisk.length,
    revenueAtRisk: atRisk.reduce((sum, r) => sum + Number(r.treatment_value ?? 0), 0)
  };
}

export interface RevenueInfluenceSummary {
  revenueGenerated: number;
  treatmentsAccepted: number;
}

export async function getRevenueInfluence(organizationId: string): Promise<RevenueInfluenceSummary> {
  const supabase = createServiceClient();
  if (!supabase) return { revenueGenerated: 0, treatmentsAccepted: 0 };

  const { data, error } = await (supabase as any)
    .from("treatment_visualizations")
    .select("accepted_value, status")
    .eq("organization_id", organizationId)
    .eq("status", "accepted");
  if (error || !data) return { revenueGenerated: 0, treatmentsAccepted: 0 };

  const rows = data as Array<{ accepted_value: number | null }>;
  return {
    revenueGenerated: rows.reduce((sum, r) => sum + Number(r.accepted_value ?? 0), 0),
    treatmentsAccepted: rows.length
  };
}

// ---------------------------------------------------------------------------
// Patient Portal — Treatment Overview / Expected Outcome / Recovery Timeline / FAQ
// ---------------------------------------------------------------------------

export interface TreatmentOverviewForPortal {
  id: string;
  status: TreatmentVisualizationStatus;
  treatmentCode: string | null;
  overview: string | null;
  expectedOutcome: string | null;
  recoveryTimeline: Array<{ day: string; milestone: string }>;
  faq: Array<{ question: string; answer: string }>;
}

export async function getTreatmentOverviewForPortal(
  treatmentVisualizationId: string
): Promise<TreatmentOverviewForPortal | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data: record, error } = await (supabase as any)
    .from("treatment_visualizations")
    .select("*")
    .eq("id", treatmentVisualizationId)
    .maybeSingle();
  if (error || !record) return null;

  const { data: media } = await (supabase as any)
    .from("treatment_media")
    .select("media_type, body")
    .eq("treatment_visualization_id", treatmentVisualizationId)
    .order("sequence", { ascending: true });

  const overviewMedia = (media ?? []).find((m: any) => m.media_type === "overview");

  return {
    id: record.id,
    status: record.status,
    treatmentCode: record.treatment_code,
    overview: overviewMedia?.body ?? null,
    expectedOutcome: record.expected_outcome,
    recoveryTimeline: record.recovery_timeline ?? [],
    faq: record.faq ?? []
  };
}

export async function listTreatmentOverviewsForPatient(
  patientId: string,
  organizationId: string
): Promise<TreatmentOverviewForPortal[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await (supabase as any)
    .from("treatment_visualizations")
    .select("id")
    .eq("patient_id", patientId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  const overviews = await Promise.all(
    (data as Array<{ id: string }>).map(row => getTreatmentOverviewForPortal(row.id))
  );
  return overviews.filter((o): o is TreatmentOverviewForPortal => o !== null);
}

export async function listTreatmentOverviewsForOrganization(
  organizationId: string,
  limit = 25
): Promise<TreatmentOverviewForPortal[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await (supabase as any)
    .from("treatment_visualizations")
    .select("id")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  const overviews = await Promise.all(
    (data as Array<{ id: string }>).map(row => getTreatmentOverviewForPortal(row.id))
  );
  return overviews.filter((o): o is TreatmentOverviewForPortal => o !== null);
}

// ---------------------------------------------------------------------------
// Reporting — Education Engagement / Acceptance Lift / Revenue Influence
// ---------------------------------------------------------------------------

export interface TreatmentVisualizationReport {
  organizationId: string;
  educationEngagement: { sent: number; viewed: number; viewRate: number };
  acceptanceLift: { delivered: number; accepted: number; acceptanceRate: number };
  revenueInfluence: RevenueInfluenceSummary;
}

export async function getTreatmentVisualizationReport(organizationId: string): Promise<TreatmentVisualizationReport> {
  const supabase = createServiceClient();
  const empty: TreatmentVisualizationReport = {
    organizationId,
    educationEngagement: { sent: 0, viewed: 0, viewRate: 0 },
    acceptanceLift: { delivered: 0, accepted: 0, acceptanceRate: 0 },
    revenueInfluence: { revenueGenerated: 0, treatmentsAccepted: 0 }
  };
  if (!supabase) return empty;

  const { data, error } = await (supabase as any)
    .from("treatment_visualizations")
    .select("status")
    .eq("organization_id", organizationId);
  if (error || !data) return empty;

  const rows = data as Array<{ status: TreatmentVisualizationStatus }>;
  const delivered = rows.filter(r => r.status !== "pending" && r.status !== "failed").length;
  const sent = rows.filter(r => ["education_sent", "viewed", "accepted", "declined"].includes(r.status)).length;
  const viewed = rows.filter(r => ["viewed", "accepted", "declined"].includes(r.status)).length;
  const accepted = rows.filter(r => r.status === "accepted").length;

  const revenueInfluence = await getRevenueInfluence(organizationId);

  return {
    organizationId,
    educationEngagement: { sent, viewed, viewRate: sent > 0 ? Math.round((viewed / sent) * 100) : 0 },
    acceptanceLift: { delivered, accepted, acceptanceRate: delivered > 0 ? Math.round((accepted / delivered) * 100) : 0 },
    revenueInfluence
  };
}
