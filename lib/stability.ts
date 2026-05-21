import type { Database, PipelineKey } from "@/lib/database.types";
import { getTenantData } from "@/lib/data/tenants";
import { getEnterpriseCloudState } from "@/lib/enterprise-cloud";
import { normalizeOpenDentalRecord, reconcileOpenDentalBatch, pilotOpenDentalRecords } from "@/lib/open-dental";
import { createServiceClient } from "@/lib/supabase/server";

export type QueueEvent = Database["public"]["Tables"]["queue_events"]["Row"];
export type ReplayEvent = Database["public"]["Tables"]["replay_events"]["Row"];
export type IntelligenceRun = Database["public"]["Tables"]["intelligence_runs"]["Row"];
export type RecommendationLineage = Database["public"]["Tables"]["recommendation_lineage"]["Row"];
export type ForecastAccuracy = Database["public"]["Tables"]["forecast_accuracy"]["Row"];
export type AnomalyValidation = Database["public"]["Tables"]["anomaly_validations"]["Row"];
export type OrchestrationLog = Database["public"]["Tables"]["orchestration_logs"]["Row"];
export type OperationalHealthSnapshot = Database["public"]["Tables"]["operational_health_snapshots"]["Row"];

export interface MissionControlState {
  queueEvents: QueueEvent[];
  replayEvents: ReplayEvent[];
  intelligenceRuns: IntelligenceRun[];
  recommendationLineage: RecommendationLineage[];
  forecastAccuracy: ForecastAccuracy[];
  anomalyValidations: AnomalyValidation[];
  orchestrationLogs: OrchestrationLog[];
  health: OperationalHealthSnapshot;
  openDental: ReturnType<typeof buildOpenDentalPilotState>;
}

export async function getMissionControlState(): Promise<MissionControlState> {
  const tenant = await getTenantData();
  const orgId = tenant.tenant.organizationId ?? tenant.organization.id;
  const empty = emptyMissionControlState(orgId);
  const supabase = createServiceClient();
  if (!supabase) return empty;

  const [queueEvents, replayEvents, intelligenceRuns, recommendationLineage, forecastAccuracy, anomalyValidations, orchestrationLogs, health] = await Promise.all([
    supabase.from("queue_events").select("*").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(50),
    supabase.from("replay_events").select("*").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(30),
    supabase.from("intelligence_runs").select("*").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(30),
    supabase.from("recommendation_lineage").select("*").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(30),
    supabase.from("forecast_accuracy").select("*").eq("organization_id", orgId).order("measured_at", { ascending: false }).limit(30),
    supabase.from("anomaly_validations").select("*").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(30),
    supabase.from("orchestration_logs").select("*").eq("organization_id", orgId).order("started_at", { ascending: false }).limit(50),
    supabase.from("operational_health_snapshots").select("*").eq("organization_id", orgId).order("snapshot_at", { ascending: false }).limit(1)
  ]);

  return {
    queueEvents: queueEvents.data ?? [],
    replayEvents: replayEvents.data ?? [],
    intelligenceRuns: intelligenceRuns.data ?? [],
    recommendationLineage: recommendationLineage.data ?? [],
    forecastAccuracy: forecastAccuracy.data ?? [],
    anomalyValidations: anomalyValidations.data ?? [],
    orchestrationLogs: orchestrationLogs.data ?? [],
    health: health.data?.[0] ?? empty.health,
    openDental: empty.openDental
  };
}

export async function runOpenDentalPilotSync() {
  const tenant = await getTenantData();
  const orgId = tenant.tenant.organizationId ?? tenant.organization.id;
  const locationId = tenant.locations[0]?.id ?? null;
  const records = pilotOpenDentalRecords();
  const reconciliation = reconcileOpenDentalBatch(records);
  const events = reconciliation.accepted.map(record => normalizeOpenDentalRecord(record, orgId, locationId));
  return {
    organizationId: orgId,
    locationId,
    accepted: events.length,
    duplicates: reconciliation.duplicates,
    reconciliationHash: reconciliation.reconciliationHash,
    events
  };
}

export async function createReplayRequest(input: { replayScope?: string; targetPipeline?: PipelineKey; reason?: string; sourceQueueEventId?: string | null }) {
  const tenant = await getTenantData();
  const orgId = tenant.tenant.organizationId ?? tenant.organization.id;
  const replay: ReplayEvent = {
    id: `replay-${Date.now()}`,
    organization_id: orgId,
    requested_by: null,
    replay_scope: input.replayScope ?? "failed_events",
    target_pipeline: input.targetPipeline ?? "intelligence",
    source_queue_event_id: input.sourceQueueEventId ?? null,
    status: "requested",
    replay_reason: input.reason ?? "Operator requested recovery",
    replay_payload: { authorization: "internal_control" },
    started_at: null,
    completed_at: null,
    created_at: new Date().toISOString()
  };
  return replay;
}

export function calibrateConfidence(input: { baseConfidence: number; historicalEffectiveness: number; driftScore?: number; falsePositiveRate?: number }) {
  const driftPenalty = Number(input.driftScore ?? 0) * 0.18;
  const falsePositivePenalty = Number(input.falsePositiveRate ?? 0) * 0.12;
  const calibrated = Math.max(0, Math.min(0.98, input.baseConfidence * 0.55 + input.historicalEffectiveness * 0.45 - driftPenalty - falsePositivePenalty));
  return {
    calibrated,
    grade: calibrated >= 0.9 ? "excellent" : calibrated >= 0.8 ? "good" : calibrated >= 0.68 ? "watch" : "poor"
  };
}

export async function evaluateIntelligenceGrounding(prompt: string) {
  const [mission, cloud] = await Promise.all([getMissionControlState(), getEnterpriseCloudState()]);
  const groundingSources = ["operational metrics", "benchmark history", "recommendation history", "scheduling patterns", "retention outcomes", "operational memory"];
  const relevance = mission.intelligenceRuns[0]?.operational_relevance ?? 0;
  const hallucination = prompt.toLowerCase().includes("guarantee") ? 0.18 : 0.04;
  return {
    groundingSources,
    operationalRelevance: relevance,
    hallucinationScore: hallucination,
    benchmarkCorrectness: mission.intelligenceRuns[0]?.benchmark_correctness ?? 0,
    confidence: calibrateConfidence({
      baseConfidence: cloud.confidenceMatrix[0]?.certainty ? cloud.confidenceMatrix[0].certainty / 100 : 0,
      historicalEffectiveness: mission.recommendationLineage[0]?.historical_effectiveness ?? 0,
      driftScore: mission.forecastAccuracy[0]?.drift_score ?? 0
    })
  };
}

export function getQueueHealth(queueEvents: QueueEvent[]) {
  const total = queueEvents.length;
  if (!total) return { total: 0, failed: 0, processing: 0, retries: 0, stability: 0 };
  const failed = queueEvents.filter(event => event.status === "failed" || event.status === "dead_letter").length;
  const processing = queueEvents.filter(event => event.status === "processing").length;
  const retries = queueEvents.reduce((sum, event) => sum + event.attempt_count, 0);
  const stability = Math.max(0, Math.round((1 - failed / total) * 100 - retries * 1.4));
  return { total, failed, processing, retries, stability };
}

function emptyMissionControlState(organizationId: string): MissionControlState {
  const now = new Date().toISOString();
  const queueEvents: QueueEvent[] = [];
  const replayEvents: ReplayEvent[] = [];
  const intelligenceRuns: IntelligenceRun[] = [];
  const recommendationLineage: RecommendationLineage[] = [];
  const forecastAccuracy: ForecastAccuracy[] = [];
  const anomalyValidations: AnomalyValidation[] = [];
  const orchestrationLogs: OrchestrationLog[] = [];
  const queueHealth = getQueueHealth(queueEvents);
  const health: OperationalHealthSnapshot = {
    id: "health-current",
    organization_id: organizationId,
    snapshot_at: now,
    orchestration_health: 0,
    ai_reliability_score: 0,
    forecast_quality_score: 0,
    queue_stability_score: queueHealth.stability,
    operational_confidence_score: 0,
    resilience_score: 0,
    summary: { failedEvents: queueHealth.failed, retryPressure: queueHealth.retries }
  };
  return {
    queueEvents,
    replayEvents,
    intelligenceRuns,
    recommendationLineage,
    forecastAccuracy,
    anomalyValidations,
    orchestrationLogs,
    health,
    openDental: buildOpenDentalPilotState(organizationId)
  };
}

function buildOpenDentalPilotState(organizationId: string) {
  const records = pilotOpenDentalRecords();
  const reconciliation = reconcileOpenDentalBatch(records);
  const events = reconciliation.accepted.map(record => normalizeOpenDentalRecord(record, organizationId, "loc-round-rock"));
  return {
    recordsSeen: records.length,
    acceptedEvents: events.length,
    duplicatesPrevented: reconciliation.duplicates.length,
    reconciliationHash: reconciliation.reconciliationHash,
    supportedScopes: ["appointments", "cancellations", "recall schedules", "provider schedules", "patient engagement", "hygiene utilization", "scheduling metrics"],
    emittedPipelines: ["ingestion", "intelligence", "recommendation", "forecasting", "orchestration", "notification"] as PipelineKey[],
    eventPreview: []
  };
}
