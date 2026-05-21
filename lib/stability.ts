import type { Database, PipelineKey, QueueStatus, ReplayStatus } from "@/lib/database.types";
import { getTenantData } from "@/lib/data/tenants";
import { getEnterpriseCloudState } from "@/lib/enterprise-cloud";
import { normalizeOpenDentalRecord, reconcileOpenDentalBatch, seededOpenDentalRecords } from "@/lib/open-dental";
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
  const seeded = seededMissionControlState(orgId);
  const supabase = createServiceClient();
  if (!supabase) return seeded;

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
    queueEvents: queueEvents.data?.length ? queueEvents.data : seeded.queueEvents,
    replayEvents: replayEvents.data?.length ? replayEvents.data : seeded.replayEvents,
    intelligenceRuns: intelligenceRuns.data?.length ? intelligenceRuns.data : seeded.intelligenceRuns,
    recommendationLineage: recommendationLineage.data?.length ? recommendationLineage.data : seeded.recommendationLineage,
    forecastAccuracy: forecastAccuracy.data?.length ? forecastAccuracy.data : seeded.forecastAccuracy,
    anomalyValidations: anomalyValidations.data?.length ? anomalyValidations.data : seeded.anomalyValidations,
    orchestrationLogs: orchestrationLogs.data?.length ? orchestrationLogs.data : seeded.orchestrationLogs,
    health: health.data?.[0] ?? seeded.health,
    openDental: seeded.openDental
  };
}

export async function runOpenDentalPilotSync() {
  const tenant = await getTenantData();
  const orgId = tenant.tenant.organizationId ?? tenant.organization.id;
  const locationId = tenant.locations[0]?.id ?? null;
  const records = seededOpenDentalRecords();
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
  const calibrated = Math.max(0.1, Math.min(0.98, input.baseConfidence * 0.55 + input.historicalEffectiveness * 0.45 - driftPenalty - falsePositivePenalty));
  return {
    calibrated,
    grade: calibrated >= 0.9 ? "excellent" : calibrated >= 0.8 ? "good" : calibrated >= 0.68 ? "watch" : "poor"
  };
}

export async function evaluateIntelligenceGrounding(prompt: string) {
  const [mission, cloud] = await Promise.all([getMissionControlState(), getEnterpriseCloudState()]);
  const groundingSources = ["operational metrics", "benchmark history", "recommendation history", "scheduling patterns", "retention outcomes", "operational memory"];
  const relevance = mission.intelligenceRuns[0]?.operational_relevance ?? 0.88;
  const hallucination = prompt.toLowerCase().includes("guarantee") ? 0.18 : 0.04;
  return {
    groundingSources,
    operationalRelevance: relevance,
    hallucinationScore: hallucination,
    benchmarkCorrectness: mission.intelligenceRuns[0]?.benchmark_correctness ?? 0.9,
    confidence: calibrateConfidence({
      baseConfidence: cloud.confidenceMatrix[0]?.certainty ? cloud.confidenceMatrix[0].certainty / 100 : 0.86,
      historicalEffectiveness: mission.recommendationLineage[0]?.historical_effectiveness ?? 0.82,
      driftScore: mission.forecastAccuracy[0]?.drift_score ?? 0.06
    })
  };
}

export function getQueueHealth(queueEvents: QueueEvent[]) {
  const total = Math.max(1, queueEvents.length);
  const failed = queueEvents.filter(event => event.status === "failed" || event.status === "dead_letter").length;
  const processing = queueEvents.filter(event => event.status === "processing").length;
  const retries = queueEvents.reduce((sum, event) => sum + event.attempt_count, 0);
  const stability = Math.max(0, Math.round((1 - failed / total) * 100 - retries * 1.4));
  return { total, failed, processing, retries, stability };
}

function seededMissionControlState(organizationId: string): MissionControlState {
  const now = new Date().toISOString();
  const queueEvents: QueueEvent[] = [
    queue("queue-1", organizationId, "ingestion", "completed", 0),
    queue("queue-2", organizationId, "intelligence", "processing", 1),
    queue("queue-3", organizationId, "recommendation", "pending", 0),
    queue("queue-4", organizationId, "forecasting", "failed", 3),
    queue("queue-5", organizationId, "orchestration", "dead_letter", 5)
  ];
  const replayEvents: ReplayEvent[] = [
    replay("replay-1", organizationId, "failed_events", "forecasting", "completed"),
    replay("replay-2", organizationId, "intelligence_generation", "intelligence", "requested")
  ];
  const intelligenceRuns: IntelligenceRun[] = [
    intelligenceRun("intel-1", organizationId, "alice_grounding_eval", "passed", 0.03, 0.91, 0.9, 0.88),
    intelligenceRun("intel-2", organizationId, "benchmark_validation", "warning", 0.05, 0.84, 0.82, 0.8)
  ];
  const recommendationLineage: RecommendationLineage[] = [
    lineage("lineage-1", organizationId, "Wednesday cancellation recovery", 0.87, 0.82),
    lineage("lineage-2", organizationId, "180-day recall acceleration", 0.9, 0.86)
  ];
  const forecastAccuracy: ForecastAccuracy[] = [
    forecastAccuracyRecord("fa-1", organizationId, "cancellation_risk", 68, 64, 0.06, 0.91),
    forecastAccuracyRecord("fa-2", organizationId, "retention_volatility", 42, 49, 0.14, 0.82)
  ];
  const anomalyValidations: AnomalyValidation[] = [
    anomalyValidation("av-1", organizationId, "queue_instability", "warning", false, 0.88),
    anomalyValidation("av-2", organizationId, "forecast_drift", "info", false, 0.83)
  ];
  const orchestrationLogs: OrchestrationLog[] = [
    orchestrationLog("orch-1", organizationId, "recovery_sequence", "ingest_open_dental", "completed"),
    orchestrationLog("orch-2", organizationId, "recovery_sequence", "evaluate_grounding", "completed"),
    orchestrationLog("orch-3", organizationId, "recovery_sequence", "queue_recommendation", "processing")
  ];
  const queueHealth = getQueueHealth(queueEvents);
  const health: OperationalHealthSnapshot = {
    id: "health-current",
    organization_id: organizationId,
    snapshot_at: now,
    orchestration_health: 86,
    ai_reliability_score: 89,
    forecast_quality_score: 84,
    queue_stability_score: queueHealth.stability,
    operational_confidence_score: 87,
    resilience_score: 82,
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
  const records = seededOpenDentalRecords();
  const reconciliation = reconcileOpenDentalBatch(records);
  const events = reconciliation.accepted.map(record => normalizeOpenDentalRecord(record, organizationId, "loc-round-rock"));
  return {
    recordsSeen: records.length,
    acceptedEvents: events.length,
    duplicatesPrevented: reconciliation.duplicates.length,
    reconciliationHash: reconciliation.reconciliationHash,
    supportedScopes: ["appointments", "cancellations", "recall schedules", "provider schedules", "patient engagement", "hygiene utilization", "scheduling metrics"],
    emittedPipelines: ["ingestion", "intelligence", "recommendation", "forecasting", "orchestration", "notification"] as PipelineKey[],
    sampleEvents: events.slice(0, 4)
  };
}

function queue(id: string, organizationId: string, pipeline: PipelineKey, status: QueueStatus, attempts: number): QueueEvent {
  const now = new Date().toISOString();
  return {
    id,
    organization_id: organizationId,
    operational_event_id: null,
    pipeline,
    status,
    correlation_id: `00000000-0000-4000-8000-${id.replace(/\D/g, "").padStart(12, "0")}`,
    idempotency_key: `${pipeline}:${id}`,
    attempt_count: attempts,
    max_attempts: 5,
    visible_at: now,
    next_retry_at: status === "failed" ? new Date(Date.now() + 1000 * 60 * 3).toISOString() : null,
    dead_letter_reason: status === "dead_letter" ? "Max attempts exceeded with provider timeout" : null,
    payload: { source: "mission_control_seed" },
    created_at: now,
    updated_at: now
  };
}

function replay(id: string, organizationId: string, scope: string, pipeline: PipelineKey, status: ReplayStatus): ReplayEvent {
  const now = new Date().toISOString();
  return {
    id,
    organization_id: organizationId,
    requested_by: null,
    replay_scope: scope,
    target_pipeline: pipeline,
    source_queue_event_id: null,
    status,
    replay_reason: "Operational recovery validation",
    replay_payload: { dryRun: true },
    started_at: status === "requested" ? null : now,
    completed_at: status === "completed" ? now : null,
    created_at: now
  };
}

function intelligenceRun(id: string, organizationId: string, type: string, status: IntelligenceRun["status"], hallucination: number, relevance: number, benchmark: number, confidence: number): IntelligenceRun {
  const now = new Date().toISOString();
  return {
    id,
    organization_id: organizationId,
    run_type: type,
    status,
    grounding_sources: ["operational metrics", "benchmark history", "recommendation history", "operational memory"],
    input_fingerprint: `${type}-${confidence}`,
    output_summary: "Grounded operational intelligence response evaluated against current metrics.",
    hallucination_score: hallucination,
    operational_relevance: relevance,
    benchmark_correctness: benchmark,
    confidence,
    evaluation: { passed: status !== "failed" },
    created_at: now,
    completed_at: now
  };
}

function lineage(id: string, organizationId: string, title: string, confidence: number, effectiveness: number): RecommendationLineage {
  return {
    id,
    organization_id: organizationId,
    recommendation_id: null,
    source_event_ids: [],
    source_signals: ["Open Dental scheduling signal", "Benchmark variance", "Operational memory"],
    operational_reasoning: `${title} is supported by scheduling patterns, retention outcomes, and benchmark movement.`,
    supporting_metrics: { confidence, effectiveness },
    confidence_score: confidence,
    historical_effectiveness: effectiveness,
    expected_outcome: "Improve recovery priority while preserving operator approval.",
    accepted_at: confidence > 0.88 ? new Date().toISOString() : null,
    rejected_at: null,
    outcome_payload: { revenueRecovery: "+$8.4K" },
    created_at: new Date().toISOString()
  };
}

function forecastAccuracyRecord(id: string, organizationId: string, type: string, predicted: number, actual: number, drift: number, quality: number): ForecastAccuracy {
  return {
    id,
    organization_id: organizationId,
    forecast_id: null,
    forecast_type: type,
    predicted_value: predicted,
    actual_value: actual,
    drift_score: drift,
    quality_score: quality,
    evaluation_window: "14 days",
    measured_at: new Date().toISOString()
  };
}

function anomalyValidation(id: string, organizationId: string, type: string, severity: AnomalyValidation["severity"], falsePositive: boolean, quality: number): AnomalyValidation {
  return {
    id,
    organization_id: organizationId,
    anomaly_event_id: null,
    anomaly_type: type,
    severity,
    precision_score: quality,
    false_positive: falsePositive,
    escalation_quality: quality,
    operational_relevance: quality,
    validator_notes: "Validated against operational event history.",
    created_at: new Date().toISOString()
  };
}

function orchestrationLog(id: string, organizationId: string, sequence: string, step: string, status: QueueStatus): OrchestrationLog {
  return {
    id,
    organization_id: organizationId,
    correlation_id: "00000000-0000-4000-8000-000000000001",
    sequence_name: sequence,
    step_name: step,
    status,
    dependency_keys: ["tenant_scope", "idempotency_key", "approval_gate"],
    trace_payload: { operatorVisible: true },
    started_at: new Date().toISOString(),
    completed_at: status === "completed" ? new Date().toISOString() : null
  };
}
