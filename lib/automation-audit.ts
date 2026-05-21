import type { AutomationCoverageStatus, AutomationDomainKey, Database, PipelineKey } from "@/lib/database.types";
import { getTenantData } from "@/lib/data/tenants";
import { createServiceClient } from "@/lib/supabase/server";

export type AutomationBlueprint = Database["public"]["Tables"]["automation_blueprints"]["Row"];
export type AutomationAuditRun = Database["public"]["Tables"]["automation_audit_runs"]["Row"];
export type AutomationCoverageResult = Database["public"]["Tables"]["automation_coverage_results"]["Row"];

const requiredControls = [
  "retries",
  "idempotency",
  "replayability",
  "lineage tracing",
  "confidence scoring",
  "audit logging",
  "observability",
  "rollback safety",
  "tenant isolation",
  "operational telemetry"
];

const requiredEventTypes = [
  "operational_events",
  "recommendation_events",
  "forecast_events",
  "anomaly_events",
  "orchestration_events",
  "replay_events",
  "notification_events",
  "simulation_events",
  "benchmark_events",
  "intelligence_events"
];

const requiredPipelines: PipelineKey[] = ["ingestion", "intelligence", "recommendation", "forecasting", "orchestration", "notification"];

export interface AutomationAuditState {
  blueprints: AutomationBlueprint[];
  auditRun: AutomationAuditRun;
  coverageResults: AutomationCoverageResult[];
  domainCoverage: Array<{ domain: AutomationDomainKey; complete: number; total: number; score: number }>;
  criticalGaps: string[];
  e2eChecklist: Array<{ label: string; complete: boolean; detail: string }>;
}

export async function getAutomationAuditState(): Promise<AutomationAuditState> {
  const tenant = await getTenantData();
  const orgId = tenant.tenant.organizationId ?? tenant.organization.id;
  const seeded = buildAutomationAudit(orgId, seededAutomationBlueprints(orgId));
  const supabase = createServiceClient();
  if (!supabase) return seeded;

  const [blueprints, runs, results] = await Promise.all([
    supabase.from("automation_blueprints").select("*").or(`organization_id.eq.${orgId},organization_id.is.null`).order("domain"),
    supabase.from("automation_audit_runs").select("*").eq("organization_id", orgId).order("run_at", { ascending: false }).limit(1),
    supabase.from("automation_coverage_results").select("*").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(100)
  ]);

  if (!blueprints.data?.length) return seeded;
  const built = buildAutomationAudit(orgId, blueprints.data);
  return {
    ...built,
    auditRun: runs.data?.[0] ?? built.auditRun,
    coverageResults: results.data?.length ? results.data : built.coverageResults
  };
}

export function buildAutomationAudit(organizationId: string, blueprints: AutomationBlueprint[]): AutomationAuditState {
  const coverageResults = blueprints.map(blueprint => evaluateBlueprint(organizationId, blueprint));
  const completeCount = coverageResults.filter(result => result.coverage_status === "complete").length;
  const partialCount = coverageResults.filter(result => result.coverage_status === "partial").length;
  const missingCount = coverageResults.filter(result => result.coverage_status === "missing").length;
  const riskCount = coverageResults.filter(result => result.coverage_status === "risk").length;
  const coverageScore = Math.round((coverageResults.reduce((sum, result) => sum + result.alice_visibility_score + result.replay_readiness_score + result.telemetry_score, 0) / Math.max(1, coverageResults.length * 3)) * 100);
  const criticalGaps = coverageResults
    .filter(result => result.coverage_status !== "complete")
    .flatMap(result => [`${result.name}: ${[...(result.missing_event_types as string[]), ...(result.missing_controls as string[]), ...(result.missing_pipelines as string[])].slice(0, 2).join(", ")}`])
    .slice(0, 8);
  const auditRun: AutomationAuditRun = {
    id: "automation-audit-current",
    organization_id: organizationId,
    run_at: new Date().toISOString(),
    total_blueprints: blueprints.length,
    complete_count: completeCount,
    partial_count: partialCount,
    missing_count: missingCount,
    risk_count: riskCount,
    coverage_score: coverageScore,
    critical_gaps: criticalGaps,
    recommendations: [
      "Prioritize full event emission coverage for every revenue recovery domain.",
      "Require lineage and replay checks before each automation is marked production-ready.",
      "Feed every domain into ALICE grounding through intelligence runs and recommendation lineage.",
      "Use Open Dental pilot events as the first live validation path for scheduling, recall, and retention."
    ]
  };
  const domains = [...new Set(blueprints.map(blueprint => blueprint.domain))];
  const domainCoverage = domains.map(domain => {
    const rows = coverageResults.filter(result => result.domain === domain);
    const complete = rows.filter(row => row.coverage_status === "complete").length;
    return { domain, complete, total: rows.length, score: Math.round((complete / Math.max(1, rows.length)) * 100) };
  });
  return {
    blueprints,
    auditRun,
    coverageResults,
    domainCoverage,
    criticalGaps,
    e2eChecklist: buildChecklist(coverageResults)
  };
}

function evaluateBlueprint(organizationId: string, blueprint: AutomationBlueprint): AutomationCoverageResult {
  const eventTypes = blueprint.emitted_event_types as string[];
  const controls = blueprint.required_controls as string[];
  const pipelines = blueprint.required_pipelines as string[];
  const missingEventTypes = requiredEventTypes.filter(eventType => !eventTypes.includes(eventType));
  const missingControls = requiredControls.filter(control => !controls.includes(control));
  const missingPipelines = requiredPipelines.filter(pipeline => !pipelines.includes(pipeline));
  const aliceVisibilityScore = Math.min(1, ((blueprint.alice_visibility as string[]).length / 5));
  const replayReadinessScore = missingControls.includes("replayability") ? 0.55 : missingControls.length ? 0.78 : 1;
  const telemetryScore = missingEventTypes.length ? Math.max(0.55, 1 - missingEventTypes.length * 0.05) : 1;
  const status = deriveStatus(missingEventTypes.length, missingControls.length, missingPipelines.length, blueprint.coverage_status);

  return {
    id: `coverage-${blueprint.id}`,
    organization_id: organizationId,
    audit_run_id: null,
    blueprint_id: blueprint.id,
    domain: blueprint.domain,
    name: blueprint.name,
    coverage_status: status,
    missing_controls: missingControls,
    missing_event_types: missingEventTypes,
    missing_pipelines: missingPipelines,
    alice_visibility_score: aliceVisibilityScore,
    replay_readiness_score: replayReadinessScore,
    telemetry_score: telemetryScore,
    created_at: new Date().toISOString()
  };
}

function deriveStatus(missingEvents: number, missingControls: number, missingPipelines: number, fallback: AutomationCoverageStatus): AutomationCoverageStatus {
  if (missingEvents === 0 && missingControls === 0 && missingPipelines === 0) return "complete";
  if (missingControls > 4 || missingEvents > 5) return "risk";
  if (missingPipelines > 2) return "partial";
  return fallback === "complete" ? "partial" : fallback;
}

function buildChecklist(results: AutomationCoverageResult[]) {
  const hasAll = (getter: (result: AutomationCoverageResult) => unknown[]) => results.every(result => getter(result).length === 0);
  return [
    { label: "All automations emit required intelligence events", complete: hasAll(result => result.missing_event_types as string[]), detail: "Operational, recommendation, forecast, anomaly, orchestration, replay, notification, simulation, benchmark, and intelligence events." },
    { label: "All automations are replay-safe", complete: results.every(result => result.replay_readiness_score >= 0.95), detail: "Retry, idempotency, replay, lineage, and rollback controls are present." },
    { label: "ALICE has full orchestration visibility", complete: results.every(result => result.alice_visibility_score >= 0.95), detail: "Each domain exposes signals, outcomes, forecasts, recommendations, and benchmark context." },
    { label: "Telemetry is measurable across domains", complete: results.every(result => result.telemetry_score >= 0.95), detail: "Each domain produces operational metrics and evaluation signals." },
    { label: "Mission Control can surface operational gaps", complete: true, detail: "Coverage results, critical gaps, and domain scoring are visible internally." }
  ];
}

function seededAutomationBlueprints(organizationId: string): AutomationBlueprint[] {
  return [
    blueprint(organizationId, "scheduling_intelligence", "Appointment Confirmation", "Reduce no-shows and protect chair utilization.", ["Appointment created", "Appointment modified", "Appointment approaching"], ["Send reminder sequence", "Escalate unconfirmed appointments", "Detect high-risk appointments", "Alert front desk"], ["confirmation rates", "response latency", "cancellation likelihood", "reminder effectiveness"], ["reminder timing", "patient responsiveness", "risk patterns", "no-show probabilities", "schedule outcomes"], "complete"),
    blueprint(organizationId, "scheduling_intelligence", "No-Show Prevention", "Prevent high-probability missed visits before they become revenue leakage.", ["High no-show probability", "Unconfirmed appointment", "Repeat cancellation behavior"], ["Priority outreach", "Escalation reminders", "Alternate contact sequence", "Waitlist optimization"], ["prevented no-shows", "revenue saved", "patient risk scoring"], ["risk scoring", "recovery outcomes", "schedule gaps", "patient behavior", "revenue impact"], "complete"),
    blueprint(organizationId, "scheduling_intelligence", "Waitlist Recovery", "Recover schedule gaps from cancellations.", ["Cancellation detected", "Open schedule gap"], ["Identify eligible patients", "Prioritize high-value opportunities", "Send availability offers", "Optimize slot utilization"], ["recovered chair hours", "fill rate", "schedule efficiency", "revenue recaptured"], ["slot utilization", "patient fit", "revenue priority", "fill outcomes", "timing effectiveness"], "partial", ["operational_events", "orchestration_events", "replay_events", "notification_events", "intelligence_events"]),
    blueprint(organizationId, "recall_recovery", "Recall Recovery Engine", "Recover overdue hygiene and recall patients.", ["Overdue recall patient", "Hygiene inactivity", "Recall risk threshold reached"], ["Reminder sequence", "Escalation cadence", "Personalized reactivation", "Retention campaign routing"], ["recall recovery rate", "inactive patient recovery", "hygiene retention trends", "recall revenue recovered"], ["recall risk", "recovery outcomes", "retention trend", "benchmark gap", "revenue impact"], "complete"),
    blueprint(organizationId, "recall_recovery", "Patient Reactivation", "Bring inactive patients back into the practice.", ["Inactive patient window exceeded", "Engagement decline", "Missed appointments"], ["Reactivation messaging", "Scheduling prompts", "Staff follow-up alerts"], ["reactivated patients", "churn recovery rate", "retention effectiveness"], ["churn probability", "engagement movement", "recovery route", "outcome tracking", "lifetime value impact"], "partial"),
    blueprint(organizationId, "review_acceleration", "Review Request Engine", "Increase reputation growth after positive patient engagement.", ["Completed appointment", "Positive engagement detected"], ["Review request timing optimization", "Multi-channel follow-up", "Escalation routing", "Review reminder sequencing"], ["review conversion rate", "timing effectiveness", "sentiment indicators", "growth velocity"], ["timing lift", "sentiment signal", "conversion trend", "benchmark rank", "quality score"], "complete"),
    blueprint(organizationId, "review_acceleration", "Reputation Risk Detection", "Detect sentiment volatility before it damages growth.", ["Declining review trends", "Negative review spike", "Engagement degradation"], ["Executive alert", "Operational escalation", "Service recovery routing", "Reputation monitoring"], ["sentiment volatility", "reputation risk scoring", "recovery effectiveness"], ["risk spike", "service recovery", "sentiment trend", "alert quality", "executive impact"], "partial"),
    blueprint(organizationId, "patient_retention", "Retention Risk Detection", "Prevent patient churn from engagement and appointment signals.", ["Declining engagement", "Repeat cancellations", "Inactivity signals", "Low responsiveness"], ["Retention process", "Executive alerts", "Personalized recovery paths", "Loyalty outreach"], ["churn probability", "retention effectiveness", "operational risk scoring"], ["patient churn", "risk explanation", "engagement history", "recovery outcome", "forecast drift"], "complete"),
    blueprint(organizationId, "patient_retention", "High-Value Patient Protection", "Protect revenue and relationships for high-value patients.", ["VIP inactivity", "High-value cancellation", "Declining engagement"], ["Priority intervention", "Manager escalation", "Retention outreach", "Concierge recovery flow"], ["revenue protection", "VIP retention score", "high-value engagement"], ["value tier", "retention action", "manager outcome", "revenue risk", "engagement movement"], "partial"),
    blueprint(organizationId, "staffing_intelligence", "Front Desk Overload Detection", "Detect operational pressure before queues degrade patient experience.", ["Call volume spikes", "Scheduling congestion", "Queue overload", "Response delays"], ["Operational alerts", "Staffing recommendations", "Schedule redistribution", "Escalation"], ["overload severity", "staffing efficiency", "operational bottlenecks"], ["overload cause", "response delay", "queue trend", "staffing need", "resilience score"], "complete"),
    blueprint(organizationId, "staffing_intelligence", "Staffing Forecast", "Forecast overload and capacity constraints.", ["Projected operational pressure", "Scheduling imbalance", "Seasonal forecasting"], ["Staffing projections", "Schedule optimization", "Executive recommendations"], ["staffing forecasts", "overload predictions", "resilience metrics"], ["capacity forecast", "seasonality", "provider load", "confidence score", "recommendation outcome"], "complete"),
    blueprint(organizationId, "executive_intelligence", "Daily Executive Briefing", "Summarize daily operations, anomalies, and opportunities.", ["Daily scheduled intelligence run"], ["Summarize operations", "Identify anomalies", "Surface opportunities", "Generate executive digest"], ["operational health", "revenue trajectory", "risk indicators", "optimization opportunities"], ["health score", "risk explanation", "revenue trajectory", "recommendation priority", "benchmark context"], "complete"),
    blueprint(organizationId, "executive_intelligence", "Weekly Intelligence Review", "Compile trend movement and benchmark changes.", ["Weekly reporting cycle"], ["Compile operational trends", "Benchmark performance", "Generate recommendations", "Summarize improvements"], ["operational maturity", "benchmark movement", "optimization impact"], ["trend summary", "benchmark movement", "accepted actions", "forecast quality", "executive decisions"], "complete"),
    blueprint(organizationId, "ai_intelligence", "Forecast Generation Engine", "Generate and validate operational forecasts.", ["Scheduled intelligence jobs", "Operational changes", "Anomaly detection"], ["Generate forecasts", "Update confidence", "Evaluate drift", "Update recommendations"], ["no-show forecasting", "staffing forecasting", "revenue forecasting", "retention forecasting"], ["forecast input", "drift score", "confidence movement", "actual outcome", "recommendation link"], "complete"),
    blueprint(organizationId, "ai_intelligence", "Recommendation Generation Engine", "Prioritize measurable operational optimization opportunities.", ["Detected inefficiencies", "Operational anomalies", "Benchmark gaps"], ["Generate recommendations", "Prioritize actions", "Estimate impact", "Calculate confidence"], ["recommendation quality", "impact estimates", "optimization probability"], ["source signals", "reasoning", "supporting metrics", "historical effectiveness", "expected outcome"], "complete"),
    blueprint(organizationId, "ai_intelligence", "Anomaly Detection Engine", "Detect abnormal operational behavior and trigger investigation.", ["Abnormal behavior", "Threshold violations", "Forecast deviations"], ["Generate alerts", "Escalate issues", "Trigger investigations", "Propose corrective actions"], ["anomaly severity", "degradation trends", "reliability indicators"], ["severity logic", "false positive history", "escalation quality", "forecast context", "outcome relevance"], "complete"),
    blueprint(organizationId, "enterprise_coordination", "Multi-Location Coordination", "Coordinate optimization across locations.", ["Cross-location divergence", "Benchmark anomalies", "Operational degradation"], ["Compare locations", "Prioritize intervention", "Coordinate optimization strategies"], ["enterprise health score", "location intelligence", "regional performance"], ["location variance", "priority queue", "benchmark rank", "intervention outcome", "operator review"], "complete"),
    blueprint(organizationId, "benchmark_intelligence", "Enterprise Benchmarking", "Refresh percentile scoring and benchmark leaders.", ["Benchmark updates", "Operational changes", "Intelligence refresh cycles"], ["Calculate rankings", "Update percentile scoring", "Identify benchmark leaders"], ["benchmark positioning", "percentile ranking", "enterprise intelligence scoring"], ["cohort logic", "rank movement", "leader detection", "gap analysis", "confidence score"], "complete"),
    blueprint(organizationId, "revenue_recovery", "Revenue Leakage Detection", "Identify recoverable revenue leakage across patient and schedule systems.", ["Revenue variance", "Schedule gaps", "Recall underperformance", "Treatment inactivity"], ["Estimate leakage", "Prioritize recovery", "Create review queue", "Track recovery outcome"], ["leakage amount", "recovery priority", "recovered revenue", "confidence movement"], ["revenue source", "confidence score", "operator decision", "outcome tracking", "benchmark impact"], "complete")
  ];
}

function blueprint(
  organizationId: string,
  domain: AutomationDomainKey,
  name: string,
  purpose: string,
  triggers: string[],
  actions: string[],
  intelligenceOutputs: string[],
  aliceVisibility: string[],
  coverageStatus: AutomationCoverageStatus,
  emittedEventTypes = requiredEventTypes,
  pipelines = requiredPipelines,
  controls = requiredControls
): AutomationBlueprint {
  const now = new Date().toISOString();
  return {
    id: `automation-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    organization_id: organizationId,
    domain,
    name,
    purpose,
    triggers,
    actions,
    intelligence_outputs: intelligenceOutputs,
    alice_visibility: aliceVisibility,
    emitted_event_types: emittedEventTypes,
    required_pipelines: pipelines,
    required_controls: controls,
    coverage_status: coverageStatus,
    created_at: now,
    updated_at: now
  };
}
